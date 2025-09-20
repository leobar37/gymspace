import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import { SubscriptionPlan, SubscriptionOrganization } from '@prisma/client';

export interface ProrationCalculation {
  remainingDays: number;
  totalDays: number;
  unusedPercentage: Decimal;
  currentPlanPrice: Decimal;
  newPlanPrice: Decimal;
  creditAmount: Decimal;
  chargeAmount: Decimal;
  netAmount: Decimal;
  description: string;
}

export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

@Injectable()
export class ProrationCalculationService {
  private readonly logger = new Logger(ProrationCalculationService.name);

  constructor() {
    // Configure Decimal.js for financial precision
    Decimal.set({
      precision: 20, // High precision for financial calculations
      rounding: Decimal.ROUND_HALF_UP, // Standard rounding for financial operations
      toExpNeg: -9, // Avoid exponential notation for very small numbers
      toExpPos: 21, // Avoid exponential notation for large numbers
    });
  }

  /**
   * Calculate proration for subscription upgrade/downgrade
   */
  calculateProration(
    currentSubscription: SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan },
    newPlan: SubscriptionPlan,
    currency: string,
    changeDate: Date = new Date(),
  ): ProrationCalculation {
    this.logger.log(`Calculating proration for subscription change`);

    // Validate inputs
    this.validateProrationInputs(currentSubscription, newPlan, changeDate);

    // Calculate billing period
    const billingPeriod = this.getCurrentBillingPeriod(currentSubscription);
    
    // Calculate remaining days
    const remainingDays = this.calculateRemainingDays(changeDate, billingPeriod.endDate);
    
    if (remainingDays <= 0) {
      throw new Error('Cannot calculate proration for past dates or end of billing period');
    }

    // Get plan prices for the current currency
    const currentPlanPrice = this.getPlanPrice(currentSubscription.subscriptionPlan, currency);
    const newPlanPrice = this.getPlanPrice(newPlan, currency);

    // Calculate unused percentage of current billing period
    const unusedPercentage = new Decimal(remainingDays).div(billingPeriod.totalDays);

    // Calculate credit for unused portion of current plan
    const creditAmount = currentPlanPrice.mul(unusedPercentage);

    // Calculate charge for new plan for remaining period
    const chargeAmount = newPlanPrice.mul(unusedPercentage);

    // Calculate net amount (positive = charge, negative = refund)
    const netAmount = chargeAmount.minus(creditAmount);

    const description = this.generateProrationDescription(
      currentSubscription.subscriptionPlan.name,
      newPlan.name,
      remainingDays,
      billingPeriod.totalDays,
      creditAmount,
      chargeAmount,
      currency,
    );

    return {
      remainingDays,
      totalDays: billingPeriod.totalDays,
      unusedPercentage,
      currentPlanPrice,
      newPlanPrice,
      creditAmount,
      chargeAmount,
      netAmount,
      description,
    };
  }

  /**
   * Calculate refund amount for subscription cancellation
   */
  calculateCancellationRefund(
    subscription: SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan },
    currency: string,
    cancellationDate: Date = new Date(),
  ): {
    refundAmount: Decimal;
    remainingDays: number;
    totalDays: number;
    description: string;
  } {
    this.logger.log(`Calculating cancellation refund`);

    // Validate inputs
    if (cancellationDate < subscription.startDate) {
      throw new Error('Cancellation date cannot be before subscription start date');
    }

    if (cancellationDate > subscription.endDate) {
      throw new Error('Cancellation date cannot be after subscription end date');
    }

    // Calculate billing period and remaining days
    const billingPeriod = this.getCurrentBillingPeriod(subscription);
    const remainingDays = this.calculateRemainingDays(cancellationDate, billingPeriod.endDate);

    if (remainingDays <= 0) {
      return {
        refundAmount: new Decimal(0),
        remainingDays: 0,
        totalDays: billingPeriod.totalDays,
        description: 'No refund - subscription period has ended',
      };
    }

    // Get plan price for the currency
    const planPrice = this.getPlanPrice(subscription.subscriptionPlan, currency);

    // Calculate unused percentage
    const unusedPercentage = new Decimal(remainingDays).div(billingPeriod.totalDays);

    // Calculate refund amount
    const refundAmount = planPrice.mul(unusedPercentage);

    const description = `Refund for ${remainingDays} unused days of ${subscription.subscriptionPlan.name} plan (${unusedPercentage.mul(100).toFixed(2)}% of billing period)`;

    return {
      refundAmount,
      remainingDays,
      totalDays: billingPeriod.totalDays,
      description,
    };
  }

  /**
   * Calculate renewal pricing with potential plan changes
   */
  calculateRenewalPricing(
    currentSubscription: SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan },
    renewalPlan: SubscriptionPlan,
    currency: string,
    renewalDate?: Date,
  ): {
    planPrice: Decimal;
    newEndDate: Date;
    billingPeriod: BillingPeriod;
    description: string;
  } {
    this.logger.log(`Calculating renewal pricing`);

    const effectiveRenewalDate = renewalDate || currentSubscription.endDate;

    // Get plan price for the currency
    const planPrice = this.getPlanPrice(renewalPlan, currency);

    // Calculate new end date based on renewal plan
    const newEndDate = this.calculateNewEndDate(effectiveRenewalDate, renewalPlan);

    // Calculate total days in new billing period
    const totalDays = this.calculateDaysBetween(effectiveRenewalDate, newEndDate);

    const billingPeriod: BillingPeriod = {
      startDate: effectiveRenewalDate,
      endDate: newEndDate,
      totalDays,
    };

    const description = `Renewal of ${renewalPlan.name} plan for ${totalDays} days starting ${effectiveRenewalDate.toDateString()}`;

    return {
      planPrice,
      newEndDate,
      billingPeriod,
      description,
    };
  }

  /**
   * Validate proration calculation inputs
   */
  private validateProrationInputs(
    currentSubscription: SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan },
    newPlan: SubscriptionPlan,
    changeDate: Date,
  ): void {
    if (!currentSubscription) {
      throw new Error('Current subscription is required');
    }

    if (!newPlan) {
      throw new Error('New plan is required');
    }

    if (changeDate < currentSubscription.startDate) {
      throw new Error('Change date cannot be before subscription start date');
    }

    if (changeDate > currentSubscription.endDate) {
      throw new Error('Change date cannot be after subscription end date');
    }

    if (currentSubscription.subscriptionPlanId === newPlan.id) {
      throw new Error('Cannot change to the same plan');
    }
  }

  /**
   * Get the current billing period for a subscription
   */
  private getCurrentBillingPeriod(
    subscription: SubscriptionOrganization,
  ): BillingPeriod {
    const startDate = subscription.startDate;
    const endDate = subscription.endDate;
    const totalDays = this.calculateDaysBetween(startDate, endDate);

    return {
      startDate,
      endDate,
      totalDays,
    };
  }

  /**
   * Calculate remaining days from a given date to end date
   */
  private calculateRemainingDays(fromDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - fromDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Round up to include partial days
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get plan price for a specific currency
   */
  private getPlanPrice(plan: SubscriptionPlan, currency: string): Decimal {
    const priceData = plan.price as any;
    
    if (!priceData || typeof priceData !== 'object') {
      throw new Error(`Invalid price data for plan ${plan.name}`);
    }

    const price = priceData[currency];
    if (price === undefined || price === null) {
      throw new Error(`Price not found for currency ${currency} in plan ${plan.name}`);
    }

    const priceDecimal = new Decimal(price);
    if (priceDecimal.isNaN() || priceDecimal.isNegative()) {
      throw new Error(`Invalid price value for currency ${currency} in plan ${plan.name}`);
    }

    return priceDecimal;
  }

  /**
   * Calculate new end date based on plan duration
   */
  private calculateNewEndDate(startDate: Date, plan: SubscriptionPlan): Date {
    const newEndDate = new Date(startDate);

    if (plan.duration && plan.durationPeriod) {
      const duration = plan.duration;
      if (plan.durationPeriod === 'MONTH') {
        newEndDate.setMonth(newEndDate.getMonth() + duration);
      } else if (plan.durationPeriod === 'DAY') {
        newEndDate.setDate(newEndDate.getDate() + duration);
      }
    } else {
      // Default to 1 month if no duration specified
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    return newEndDate;
  }

  /**
   * Generate human-readable proration description
   */
  private generateProrationDescription(
    currentPlanName: string,
    newPlanName: string,
    remainingDays: number,
    totalDays: number,
    creditAmount: Decimal,
    chargeAmount: Decimal,
    currency: string,
  ): string {
    const unusedPercentage = new Decimal(remainingDays).div(totalDays).mul(100);
    
    const descriptions = [
      `Upgrade from ${currentPlanName} to ${newPlanName}`,
      `${remainingDays} days remaining (${unusedPercentage.toFixed(2)}% of billing period)`,
      `Credit for unused ${currentPlanName}: ${creditAmount.toFixed(2)} ${currency}`,
      `Charge for ${newPlanName}: ${chargeAmount.toFixed(2)} ${currency}`,
    ];

    return descriptions.join(' | ');
  }

  /**
   * Convert Decimal to number for JSON serialization
   */
  decimalToNumber(decimal: Decimal): number {
    return decimal.toNumber();
  }

  /**
   * Convert Decimal to string with precision
   */
  decimalToString(decimal: Decimal, decimalPlaces: number = 2): string {
    return decimal.toFixed(decimalPlaces);
  }
}