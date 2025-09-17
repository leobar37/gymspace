import { Injectable, Logger } from '@nestjs/common';
import { IRequestContext } from '@gymspace/shared';
import { EmailService } from '../../../common/services/email.service';
import { PrismaService } from '../../../core/database/prisma.service';

interface SubscriptionRequestNotificationData {
  organizationName: string;
  planName: string;
  requestedByName: string;
  operationType: string;
  requestedStartDate?: Date;
  notes?: string;
}

interface RequestProcessingNotificationData {
  organizationName: string;
  planName: string;
  operationType: string;
  status: 'approved' | 'rejected' | 'cancelled';
  adminNotes?: string;
  effectiveDate?: Date;
  processedByName: string;
}

@Injectable()
export class SubscriptionNotificationService {
  private readonly logger = new Logger(SubscriptionNotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Send notification when a new subscription request is created
   */
  async notifyNewRequest(
    context: IRequestContext,
    requestData: SubscriptionRequestNotificationData,
  ): Promise<void> {
    try {
      this.logger.log(`Sending new request notification for ${requestData.organizationName}`);

      // Get admin email addresses (users with SUPER_ADMIN role)
      const adminEmails = await this.getAdminEmails();

      if (adminEmails.length === 0) {
        this.logger.warn('No admin emails found for new request notification');
        return;
      }

      const subject = `New Subscription Request: ${requestData.organizationName}`;
      const template = 'subscription-request-new';
      
      const templateData = {
        organizationName: requestData.organizationName,
        planName: requestData.planName,
        requestedByName: requestData.requestedByName,
        operationType: this.formatOperationType(requestData.operationType),
        requestedStartDate: requestData.requestedStartDate ? 
          this.formatDate(requestData.requestedStartDate) : null,
        notes: requestData.notes,
        dashboardUrl: this.getDashboardUrl(),
      };

      // Send to all admins
      await Promise.all(
        adminEmails.map(email =>
          this.emailService.sendTemplate({
            to: email,
            subject,
            template,
            data: templateData,
          })
        )
      );

      this.logger.log(`New request notification sent to ${adminEmails.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send new request notification', error);
      // Don't throw - notification failures shouldn't break the main flow
    }
  }

  /**
   * Send notification when a subscription request is processed
   */
  async notifyRequestProcessed(
    requestId: string,
    processingData: RequestProcessingNotificationData,
  ): Promise<void> {
    try {
      this.logger.log(`Sending request processing notification for ${requestId}`);

      // Get the organization owner's email
      const request = await this.prisma.subscriptionRequest.findUnique({
        where: { id: requestId },
        include: {
          organization: {
            include: {
              owner: {
                select: { email: true, name: true },
              },
            },
          },
          requestedBy: {
            select: { email: true, name: true },
          },
        },
      });

      if (!request) {
        this.logger.warn(`Request ${requestId} not found for notification`);
        return;
      }

      const recipientEmail = request.organization.owner.email;
      const recipientName = request.organization.owner.name;

      const subject = `Subscription Request ${this.formatStatus(processingData.status)}: ${processingData.organizationName}`;
      const template = `subscription-request-${processingData.status}`;
      
      const templateData = {
        recipientName,
        organizationName: processingData.organizationName,
        planName: processingData.planName,
        operationType: this.formatOperationType(processingData.operationType),
        status: this.formatStatus(processingData.status),
        adminNotes: processingData.adminNotes,
        effectiveDate: processingData.effectiveDate ? 
          this.formatDate(processingData.effectiveDate) : null,
        processedByName: processingData.processedByName,
        dashboardUrl: this.getDashboardUrl(),
      };

      await this.emailService.sendTemplate({
        to: recipientEmail,
        subject,
        template,
        data: templateData,
      });

      // Also notify the requester if different from owner
      if (request.requestedBy.email !== recipientEmail) {
        const requesterData = {
          ...templateData,
          recipientName: request.requestedBy.name,
        };
        
        await this.emailService.sendTemplate({
          to: request.requestedBy.email,
          subject,
          template,
          data: requesterData,
        });
      }

      this.logger.log(`Request processing notification sent for ${requestId}`);
    } catch (error) {
      this.logger.error('Failed to send request processing notification', error);
      // Don't throw - notification failures shouldn't break the main flow
    }
  }

  /**
   * Send notification when subscription is about to expire
   */
  async notifySubscriptionExpiring(
    organizationId: string,
    expirationDate: Date,
  ): Promise<void> {
    try {
      this.logger.log(`Sending subscription expiration notification for ${organizationId}`);

      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          owner: {
            select: { email: true, name: true },
          },
        },
      });

      if (!organization) {
        this.logger.warn(`Organization ${organizationId} not found for expiration notification`);
        return;
      }

      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const subject = `Subscription Expiring Soon: ${organization.name}`;
      const template = 'subscription-expiring';
      
      const templateData = {
        recipientName: organization.owner.name,
        organizationName: organization.name,
        expirationDate: this.formatDate(expirationDate),
        daysUntilExpiration,
        renewalUrl: `${this.getDashboardUrl()}/subscription/renew`,
      };

      await this.emailService.sendTemplate({
        to: organization.owner.email,
        subject,
        template,
        data: templateData,
      });

      this.logger.log(`Subscription expiration notification sent for ${organizationId}`);
    } catch (error) {
      this.logger.error('Failed to send subscription expiration notification', error);
    }
  }

  /**
   * Send bulk notifications for subscriptions expiring in X days
   */
  async notifyBulkExpiringSubscriptions(days: number): Promise<void> {
    try {
      this.logger.log(`Sending bulk expiration notifications for subscriptions expiring in ${days} days`);

      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + days);

      const expiringSubscriptions = await this.prisma.subscriptionOrganization.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          endDate: {
            gte: new Date(),
            lte: expiringDate,
          },
        },
        include: {
          organization: {
            include: {
              owner: {
                select: { email: true, name: true },
              },
            },
          },
          subscriptionPlan: {
            select: { name: true },
          },
        },
      });

      if (expiringSubscriptions.length === 0) {
        this.logger.log(`No subscriptions expiring in ${days} days`);
        return;
      }

      // Send notifications concurrently
      await Promise.all(
        expiringSubscriptions.map(subscription =>
          this.notifySubscriptionExpiring(subscription.organizationId, subscription.endDate)
        )
      );

      this.logger.log(`Sent ${expiringSubscriptions.length} bulk expiration notifications`);
    } catch (error) {
      this.logger.error('Failed to send bulk expiration notifications', error);
    }
  }

  /**
   * Get admin email addresses
   */
  private async getAdminEmails(): Promise<string[]> {
    // Super admins don't have users in the system, use support email or environment variable
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'soporte@theelena.me';
    return [adminEmail];
  }

  /**
   * Format operation type for display
   */
  private formatOperationType(operationType: string): string {
    const types = {
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      renewal: 'Renewal',
      cancellation: 'Cancellation',
      activation: 'Activation',
    };
    return types[operationType] || operationType;
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    const statuses = {
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return statuses[status] || status;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get dashboard URL from configuration
   */
  private getDashboardUrl(): string {
    // This should come from your configuration service
    return process.env.DASHBOARD_URL || 'https://app.gymspace.com';
  }
}