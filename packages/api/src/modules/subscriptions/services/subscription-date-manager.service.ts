import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionOrganization } from '@prisma/client';

export interface BillingCycle {
  startDate: Date;
  endDate: Date;
  duration: number;
  durationPeriod: 'DAY' | 'MONTH';
  totalDays: number;
}

export interface SubscriptionPeriod {
  current: BillingCycle;
  next?: BillingCycle;
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
  renewalWindow: {
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  };
}

export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class SubscriptionDateManagerService {
  private readonly logger = new Logger(SubscriptionDateManagerService.name);
  
  // Configuration constants
  private readonly RENEWAL_WINDOW_DAYS = 30; // Days before expiration to allow renewal
  private readonly EXPIRING_SOON_DAYS = 7; // Days before expiration to mark as "expiring soon"
  private readonly GRACE_PERIOD_DAYS = 3; // Days after expiration before suspension

  /**
   * Calculate subscription period information with billing cycles
   */
  getSubscriptionPeriod(
    subscription: SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan },
    timezone: string = 'UTC',
  ): SubscriptionPeriod {
    this.logger.log(`Calculating subscription period for subscription ${subscription.id}`);

    const now = new Date();
    const currentCycle = this.getCurrentBillingCycle(subscription);
    
    // Calculate days until expiration
    const daysUntilExpiration = this.calculateDaysUntilExpiration(now, currentCycle.endDate);
    
    // Determine expiration status
    const isExpired = daysUntilExpiration < 0;
    const isExpiring = !isExpired && daysUntilExpiration <= this.EXPIRING_SOON_DAYS;
    
    // Calculate renewal window
    const renewalWindow = this.calculateRenewalWindow(currentCycle.endDate);
    
    // Calculate next billing cycle if needed
    let nextCycle: BillingCycle | undefined;
    if (renewalWindow.isActive && !isExpired) {
      nextCycle = this.calculateNextBillingCycle(subscription.subscriptionPlan, currentCycle.endDate);
    }

    return {
      current: currentCycle,
      next: nextCycle,
      isExpiring,
      isExpired,
      daysUntilExpiration: Math.max(0, daysUntilExpiration),
      renewalWindow,
    };
  }

  /**
   * Calculate new subscription end date for upgrades/renewals
   */
  calculateNewEndDate(
    plan: SubscriptionPlan,
    startDate: Date,
    extendCurrent?: boolean,
    currentEndDate?: Date,
  ): Date {
    this.logger.log(`Calculating new end date for plan ${plan.name}`);

    let effectiveStartDate = startDate;
    
    // If extending current subscription, start from current end date
    if (extendCurrent && currentEndDate) {
      effectiveStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime()));
    }

    const endDate = new Date(effectiveStartDate);

    if (plan.duration && plan.durationPeriod) {
      this.addDurationToDate(endDate, plan.duration, plan.durationPeriod);
    } else {
      // Default to 1 month if no duration specified
      this.addDurationToDate(endDate, 1, 'MONTH');
    }

    return endDate;
  }

  /**
   * Validate subscription dates for operations
   */
  validateSubscriptionDates(
    operationType: 'upgrade' | 'downgrade' | 'renewal' | 'cancellation',
    subscription: SubscriptionOrganization,
    effectiveDate?: Date,
    newEndDate?: Date,
  ): DateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const now = new Date();
    const operationDate = effectiveDate || now;

    // Basic date validations
    if (operationDate < subscription.startDate) {
      errors.push('Operation date cannot be before subscription start date');
    }

    if (operationDate > subscription.endDate) {
      errors.push('Operation date cannot be after subscription end date');
    }

    // Operation-specific validations
    switch (operationType) {
      case 'upgrade':
      case 'downgrade':
        this.validateUpgradeDowngradeDates(subscription, operationDate, errors, warnings);
        break;
      
      case 'renewal':
        this.validateRenewalDates(subscription, operationDate, newEndDate, errors, warnings);
        break;
      
      case 'cancellation':
        this.validateCancellationDates(subscription, operationDate, errors, warnings);
        break;
    }

    // Check for grace period
    const daysUntilExpiration = this.calculateDaysUntilExpiration(now, subscription.endDate);
    if (daysUntilExpiration < -this.GRACE_PERIOD_DAYS) {
      warnings.push(`Subscription is ${Math.abs(daysUntilExpiration)} days past expiration`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate optimal effective date for subscription changes
   */
  calculateOptimalEffectiveDate(
    operationType: 'upgrade' | 'downgrade' | 'renewal',
    subscription: SubscriptionOrganization,
    requestedDate?: Date,
  ): Date {
    const now = new Date();
    const requestDate = requestedDate || now;
    
    // Ensure date is not in the past
    const effectiveDate = new Date(Math.max(now.getTime(), requestDate.getTime()));
    
    // For renewals, default to current end date if not specified
    if (operationType === 'renewal' && !requestedDate) {
      return new Date(Math.max(subscription.endDate.getTime(), now.getTime()));
    }
    
    // For upgrades/downgrades, use current date or requested date
    return effectiveDate;
  }

  /**
   * Check if subscription is in renewal window
   */
  isInRenewalWindow(subscription: SubscriptionOrganization): boolean {
    const now = new Date();
    const renewalWindow = this.calculateRenewalWindow(subscription.endDate);
    return renewalWindow.isActive;
  }

  /**
   * Check if subscription is expired with grace period
   */
  isExpiredWithGrace(subscription: SubscriptionOrganization): boolean {
    const now = new Date();
    const gracePeriodEnd = new Date(subscription.endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.GRACE_PERIOD_DAYS);
    return now > gracePeriodEnd;
  }

  /**
   * Get current billing cycle for a subscription
   */
  private getCurrentBillingCycle(
    subscription: SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan },
  ): BillingCycle {
    const plan = subscription.subscriptionPlan;
    const totalDays = this.calculateDaysBetween(subscription.startDate, subscription.endDate);

    return {
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      duration: plan.duration || 1,
      durationPeriod: plan.durationPeriod || 'MONTH',
      totalDays,
    };
  }

  /**
   * Calculate next billing cycle
   */
  private calculateNextBillingCycle(
    plan: SubscriptionPlan,
    currentEndDate: Date,
  ): BillingCycle {
    const startDate = new Date(currentEndDate);
    const endDate = this.calculateNewEndDate(plan, startDate);
    const totalDays = this.calculateDaysBetween(startDate, endDate);

    return {
      startDate,
      endDate,
      duration: plan.duration || 1,
      durationPeriod: plan.durationPeriod || 'MONTH',
      totalDays,
    };
  }

  /**
   * Calculate renewal window
   */
  private calculateRenewalWindow(endDate: Date): {
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  } {
    const now = new Date();
    const renewalStartDate = new Date(endDate);
    renewalStartDate.setDate(renewalStartDate.getDate() - this.RENEWAL_WINDOW_DAYS);
    
    return {
      startDate: renewalStartDate,
      endDate,
      isActive: now >= renewalStartDate && now <= endDate,
    };
  }

  /**
   * Calculate days until expiration
   */
  private calculateDaysUntilExpiration(fromDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - fromDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Add duration to a date
   */
  private addDurationToDate(date: Date, duration: number, period: 'DAY' | 'MONTH'): void {
    if (period === 'MONTH') {
      date.setMonth(date.getMonth() + duration);
    } else if (period === 'DAY') {
      date.setDate(date.getDate() + duration);
    }
  }

  /**
   * Validate upgrade/downgrade dates
   */
  private validateUpgradeDowngradeDates(
    subscription: SubscriptionOrganization,
    operationDate: Date,
    errors: string[],
    warnings: string[],
  ): void {
    const now = new Date();
    
    // Warn if changing subscription close to expiration
    const daysUntilExpiration = this.calculateDaysUntilExpiration(operationDate, subscription.endDate);
    if (daysUntilExpiration <= this.EXPIRING_SOON_DAYS) {
      warnings.push(`Subscription expires in ${daysUntilExpiration} days. Consider renewal instead.`);
    }
    
    // Error if trying to change expired subscription
    if (operationDate > subscription.endDate) {
      errors.push('Cannot modify expired subscription. Renewal required.');
    }
  }

  /**
   * Validate renewal dates
   */
  private validateRenewalDates(
    subscription: SubscriptionOrganization,
    operationDate: Date,
    newEndDate: Date | undefined,
    errors: string[],
    warnings: string[],
  ): void {
    const renewalWindow = this.calculateRenewalWindow(subscription.endDate);
    
    // Warn if renewing outside optimal window
    if (!renewalWindow.isActive) {
      const daysUntilWindow = this.calculateDaysUntilExpiration(operationDate, renewalWindow.startDate);
      if (daysUntilWindow > 0) {
        warnings.push(`Renewal window opens in ${daysUntilWindow} days`);
      }
    }
    
    // Validate new end date if provided
    if (newEndDate && newEndDate <= operationDate) {
      errors.push('New end date must be after operation date');
    }
  }

  /**
   * Validate cancellation dates
   */
  private validateCancellationDates(
    subscription: SubscriptionOrganization,
    operationDate: Date,
    errors: string[],
    warnings: string[],
  ): void {
    // Check if already expired
    if (operationDate > subscription.endDate) {
      warnings.push('Subscription is already expired');
    }
    
    // Calculate potential refund period
    const daysRemaining = this.calculateDaysUntilExpiration(operationDate, subscription.endDate);
    if (daysRemaining <= 0) {
      warnings.push('No refund available - subscription period has ended');
    }
  }
}