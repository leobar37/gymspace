import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago';
import { BusinessException } from '../../common/exceptions';

export interface CreateSubscriptionPlanDto {
  reason: string;
  external_reference: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'months' | 'days' | 'weeks';
    transaction_amount: number;
    currency_id: string;
    repetitions?: number;
    billing_day?: number;
    billing_day_proportional?: boolean;
    free_trial?: {
      frequency: number;
      frequency_type: 'months' | 'days' | 'weeks';
    };
  };
  payment_methods_allowed?: {
    payment_types?: object[];
    payment_methods?: object[];
  };
  back_url: string;
}

export interface CreateSubscriptionDto {
  preapproval_plan_id?: string;
  reason: string;
  external_reference: string;
  payer_email: string;
  card_token_id?: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'months' | 'days' | 'weeks';
    start_date?: string;
    end_date?: string;
    transaction_amount: number;
    currency_id: string;
    repetitions?: number;
    billing_day?: number;
    free_trial?: {
      frequency: number;
      frequency_type: 'months' | 'days' | 'weeks';
    };
  };
  back_url: string;
  status?: 'pending' | 'authorized' | 'paused' | 'cancelled';
}

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preApprovalPlan: PreApprovalPlan;
  private preApproval: PreApproval;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('mercadopago.accessToken');
    
    if (!accessToken) {
      this.logger.warn('MercadoPago access token not configured');
      return;
    }

    try {
      this.client = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
        },
      });

      this.preApprovalPlan = new PreApprovalPlan(this.client);
      this.preApproval = new PreApproval(this.client);
      
      this.logger.log('MercadoPago service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MercadoPago service', error);
    }
  }

  async onModuleInit() {
    if (!this.client) {
      this.logger.warn('MercadoPago client not initialized, skipping module initialization');
      return;
    }

    this.logger.log('MercadoPago module initialized');
  }

  /**
   * Check if MercadoPago is properly configured
   */
  isConfigured(): boolean {
    return !!this.client;
  }

  /**
   * Create a subscription plan in MercadoPago
   */
  async createSubscriptionPlan(planData: CreateSubscriptionPlanDto) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      this.logger.log(`Creating MercadoPago subscription plan: ${planData.reason}`);
      
      const response = await this.preApprovalPlan.create({
        body: planData,
      });

      this.logger.log(`Successfully created MercadoPago plan with ID: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Error creating MercadoPago subscription plan', error);
      throw new BusinessException(`Failed to create subscription plan: ${error.message}`);
    }
  }

  /**
   * Get a subscription plan from MercadoPago
   */
  async getSubscriptionPlan(planId: string) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      const response = await this.preApprovalPlan.get({
        preApprovalPlanId: planId,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error fetching MercadoPago subscription plan ${planId}`, error);
      throw new BusinessException(`Failed to fetch subscription plan: ${error.message}`);
    }
  }

  /**
   * Update a subscription plan in MercadoPago
   */
  async updateSubscriptionPlan(
    planId: string,
    updateData: Partial<CreateSubscriptionPlanDto>,
  ) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      this.logger.log(`Updating MercadoPago subscription plan: ${planId}`);
      
      const response = await this.preApprovalPlan.update({
        id: planId,
        updatePreApprovalPlanRequest: updateData,
      });

      this.logger.log(`Successfully updated MercadoPago plan: ${planId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error updating MercadoPago subscription plan ${planId}`, error);
      throw new BusinessException(`Failed to update subscription plan: ${error.message}`);
    }
  }

  /**
   * Create a subscription in MercadoPago
   */
  async createSubscription(subscriptionData: CreateSubscriptionDto) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      this.logger.log(`Creating MercadoPago subscription: ${subscriptionData.reason}`);
      
      const response = await this.preApproval.create({
        body: subscriptionData,
      });

      this.logger.log(`Successfully created MercadoPago subscription with ID: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Error creating MercadoPago subscription', error);
      throw new BusinessException(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Get a subscription from MercadoPago
   */
  async getSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      const response = await this.preApproval.get({
        id: subscriptionId,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error fetching MercadoPago subscription ${subscriptionId}`, error);
      throw new BusinessException(`Failed to fetch subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription in MercadoPago
   */
  async cancelSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      this.logger.log(`Cancelling MercadoPago subscription: ${subscriptionId}`);
      
      const response = await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: 'cancelled',
        },
      });

      this.logger.log(`Successfully cancelled MercadoPago subscription: ${subscriptionId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error cancelling MercadoPago subscription ${subscriptionId}`, error);
      throw new BusinessException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Pause a subscription in MercadoPago
   */
  async pauseSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      this.logger.log(`Pausing MercadoPago subscription: ${subscriptionId}`);
      
      const response = await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: 'paused',
        },
      });

      this.logger.log(`Successfully paused MercadoPago subscription: ${subscriptionId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error pausing MercadoPago subscription ${subscriptionId}`, error);
      throw new BusinessException(`Failed to pause subscription: ${error.message}`);
    }
  }

  /**
   * Resume a paused subscription in MercadoPago
   */
  async resumeSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      this.logger.log(`Resuming MercadoPago subscription: ${subscriptionId}`);
      
      const response = await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: 'authorized',
        },
      });

      this.logger.log(`Successfully resumed MercadoPago subscription: ${subscriptionId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error resuming MercadoPago subscription ${subscriptionId}`, error);
      throw new BusinessException(`Failed to resume subscription: ${error.message}`);
    }
  }

  /**
   * Search subscription plans in MercadoPago
   */
  async searchSubscriptionPlans(filters?: {
    external_reference?: string;
    status?: string;
  }) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      const response = await this.preApprovalPlan.search({
        options: filters,
      });

      return response;
    } catch (error) {
      this.logger.error('Error searching MercadoPago subscription plans', error);
      throw new BusinessException(`Failed to search subscription plans: ${error.message}`);
    }
  }

  /**
   * Search subscriptions in MercadoPago
   */
  async searchSubscriptions(filters?: {
    status?: string;
    external_reference?: string;
  }) {
    if (!this.isConfigured()) {
      throw new BusinessException('MercadoPago is not properly configured');
    }

    try {
      const response = await this.preApproval.search({
        options: filters,
      });

      return response;
    } catch (error) {
      this.logger.error('Error searching MercadoPago subscriptions', error);
      throw new BusinessException(`Failed to search subscriptions: ${error.message}`);
    }
  }
}