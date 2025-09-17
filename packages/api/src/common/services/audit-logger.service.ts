import { Injectable, Logger } from '@nestjs/common';
import { IRequestContext } from '@gymspace/shared';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  gymId?: string;
  organizationId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  /**
   * Log an audit event for subscription management operations
   */
  async logSubscriptionAction(
    context: IRequestContext,
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      action,
      entityType,
      entityId,
      userId: context.getUserId(),
      gymId: context.getGymId(),
      organizationId: context.getOrganizationId(),
      details: {
        ...details,
        permissions: context.permissions,
      },
      timestamp: new Date(),
      ipAddress: this.extractIpAddress(request),
      userAgent: this.extractUserAgent(request),
    };

    // Log the audit entry
    this.logger.log(
      `AUDIT: ${action} ${entityType}${entityId ? ` [${entityId}]` : ''} by user ${context.getUserId()}`,
      {
        auditEntry,
      },
    );

    // In a production system, you might want to:
    // 1. Store audit logs in a separate database/table
    // 2. Send to external audit service
    // 3. Integrate with monitoring/alerting systems
    
    // For now, we're using structured logging which can be picked up by log aggregation tools
  }

  /**
   * Log admin-specific subscription actions
   */
  async logAdminAction(
    context: IRequestContext,
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    await this.logSubscriptionAction(
      context,
      `ADMIN_${action}`,
      entityType,
      entityId,
      {
        ...details,
        adminAction: true,
      },
      request,
    );
  }

  /**
   * Log plan management actions
   */
  async logPlanAction(
    context: IRequestContext,
    action: 'CREATE_PLAN' | 'UPDATE_PLAN' | 'DELETE_PLAN',
    planId?: string,
    planData?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    await this.logAdminAction(
      context,
      action,
      'subscription_plan',
      planId,
      {
        planData: this.sanitizePlanData(planData),
      },
      request,
    );
  }

  /**
   * Log subscription request processing
   */
  async logRequestProcessing(
    context: IRequestContext,
    action: 'APPROVE_REQUEST' | 'REJECT_REQUEST' | 'CANCEL_REQUEST',
    requestId: string,
    requestData?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    await this.logAdminAction(
      context,
      action,
      'subscription_request',
      requestId,
      {
        requestData: this.sanitizeRequestData(requestData),
      },
      request,
    );
  }

  /**
   * Log subscription operations (updated signature for transition service)
   */
  async logSubscriptionOperation(
    context: IRequestContext,
    operationType: string,
    organizationId: string,
    operationData?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    await this.logSubscriptionAction(
      context,
      operationType,
      'subscription_operation',
      organizationId,
      {
        operationData: this.sanitizeOperationData(operationData),
      },
      request,
    );
  }

  /**
   * Log cancellation processing
   */
  async logCancellationProcessing(
    context: IRequestContext,
    action: 'PROCESS_CANCELLATION',
    cancellationId: string,
    cancellationData?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    await this.logAdminAction(
      context,
      action,
      'subscription_cancellation',
      cancellationId,
      {
        cancellationData: this.sanitizeCancellationData(cancellationData),
      },
      request,
    );
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(request?: any): string | undefined {
    if (!request) return undefined;
    
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers?.['x-real-ip']
    );
  }

  /**
   * Extract user agent from request
   */
  private extractUserAgent(request?: any): string | undefined {
    return request?.headers?.['user-agent'];
  }

  /**
   * Sanitize plan data for audit logging (remove sensitive information)
   */
  private sanitizePlanData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    
    // Remove or mask sensitive fields if any
    const { ...sanitized } = data;
    return sanitized;
  }

  /**
   * Sanitize request data for audit logging
   */
  private sanitizeRequestData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    
    const { ...sanitized } = data;
    return sanitized;
  }

  /**
   * Sanitize operation data for audit logging
   */
  private sanitizeOperationData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    
    const { ...sanitized } = data;
    return sanitized;
  }

  /**
   * Sanitize cancellation data for audit logging
   */
  private sanitizeCancellationData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    
    const { ...sanitized } = data;
    return sanitized;
  }
}