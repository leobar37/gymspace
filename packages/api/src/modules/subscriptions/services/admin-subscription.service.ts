import { Injectable, Logger } from '@nestjs/common';
import { IRequestContext, PaginatedResponse } from '@gymspace/shared';
import {
  BusinessException,
  ResourceNotFoundException,
  ValidationException,
} from '../../../common/exceptions';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditLoggerService } from '../../../common/services/audit-logger.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  SubscriptionPlanResponseDto,
  SubscriptionRequestResponseDto,
  ProcessRequestDto,
  SubscriptionOperationResponseDto,
  CancellationResponseDto,
  RequestAnalyticsDto,
  RequestAnalyticsQueryDto,
  RequestStatusFilter,
  RequestOperationFilter,
  SubscriptionHistoryDto,
  SubscriptionHistoryQueryDto,
} from '../dto/admin';
import { SubscriptionNotificationService } from './subscription-notification.service';

@Injectable()
export class AdminSubscriptionService {
  private readonly logger = new Logger(AdminSubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
    private readonly notificationService: SubscriptionNotificationService,
  ) {}

  /**
   * Create a new subscription plan
   */
  async createPlan(
    context: IRequestContext,
    dto: CreatePlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    this.logger.log(`Creating subscription plan: ${dto.name}`);

    // Check if plan name already exists
    const existingPlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingPlan) {
      throw new ValidationException([
        {
          field: 'name',
          message: 'A plan with this name already exists',
        },
      ]);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        billingFrequency: dto.billingFrequency,
        duration: dto.duration,
        durationPeriod: dto.durationPeriod,
        maxGyms: dto.maxGyms,
        maxClientsPerGym: dto.maxClientsPerGym,
        maxUsersPerGym: dto.maxUsersPerGym,
        features: dto.features,
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? true,
        sortOrder: dto.sortOrder ?? 0,
        createdByUserId: context.getUserId(),
      },
    });

    // Audit log the plan creation
    await this.auditLogger.logPlanAction(
      context,
      'CREATE_PLAN',
      plan.id,
      {
        planName: plan.name,
        maxGyms: plan.maxGyms,
        maxClientsPerGym: plan.maxClientsPerGym,
        maxUsersPerGym: plan.maxUsersPerGym,
        isPublic: plan.isPublic,
      },
    );

    return this.mapPlanToResponse(plan, 0);
  }

  /**
   * Get all subscription plans with usage statistics
   */
  async getPlans(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return plans.map((plan) =>
      this.mapPlanToResponse(plan, plan._count.subscriptionOrganizations),
    );
  }

  /**
   * Get a specific subscription plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: planId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    return this.mapPlanToResponse(plan, plan._count.subscriptionOrganizations);
  }

  /**
   * Update a subscription plan
   */
  async updatePlan(
    context: IRequestContext,
    planId: string,
    dto: UpdatePlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    this.logger.log(`Updating subscription plan: ${planId}`);

    // Check if plan exists
    const existingPlan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: planId,
        deletedAt: null,
      },
    });

    if (!existingPlan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    // Check for name conflicts if name is being updated
    if (dto.name && dto.name !== existingPlan.name) {
      const nameConflict = await this.prisma.subscriptionPlan.findFirst({
        where: {
          name: dto.name,
          id: { not: planId },
          deletedAt: null,
        },
      });

      if (nameConflict) {
        throw new ValidationException([
          {
            field: 'name',
            message: 'A plan with this name already exists',
          },
        ]);
      }
    }

    const updatedPlan = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...dto,
        updatedByUserId: context.getUserId(),
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return this.mapPlanToResponse(updatedPlan, updatedPlan._count.subscriptionOrganizations);
  }

  /**
   * Delete a subscription plan (soft delete)
   */
  async deletePlan(context: IRequestContext, planId: string): Promise<void> {
    this.logger.log(`Deleting subscription plan: ${planId}`);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: planId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    // Check if plan is in use
    if (plan._count.subscriptionOrganizations > 0) {
      throw new BusinessException(
        'Cannot delete a plan that is currently in use by organizations',
      );
    }

    await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        deletedAt: new Date(),
        updatedByUserId: context.getUserId(),
      },
    });

    this.logger.log(`Successfully deleted subscription plan: ${planId}`);
  }

  /**
   * Get pending subscription requests
   */
  async getPendingRequests(): Promise<SubscriptionRequestResponseDto[]> {
    const requests = await this.prisma.subscriptionRequest.findMany({
      where: {
        status: 'pending',
        deletedAt: null,
      },
      include: {
        organization: {
          select: { name: true },
        },
        subscriptionPlan: {
          select: { name: true },
        },
        requestedBy: {
          select: { name: true },
        },
        processedBy: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return requests.map(this.mapRequestToResponse);
  }

  /**
   * Process a subscription request
   */
  async processRequest(
    context: IRequestContext,
    requestId: string,
    dto: ProcessRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    this.logger.log(`Processing subscription request: ${requestId}`);

    const request = await this.prisma.subscriptionRequest.findUnique({
      where: {
        id: requestId,
        deletedAt: null,
      },
      include: {
        organization: true,
        subscriptionPlan: true,
      },
    });

    if (!request) {
      throw new ResourceNotFoundException('Subscription request not found');
    }

    if (request.status !== 'pending') {
      throw new BusinessException('Only pending requests can be processed');
    }

    // Update the request
    const updatedRequest = await this.prisma.subscriptionRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes,
        processedByUserId: context.getUserId(),
        processedAt: new Date(),
        updatedByUserId: context.getUserId(),
      },
      include: {
        organization: {
          select: { name: true },
        },
        subscriptionPlan: {
          select: { name: true },
        },
        requestedBy: {
          select: { name: true },
        },
        processedBy: {
          select: { name: true },
        },
      },
    });

    // Audit log the request processing
    await this.auditLogger.logRequestProcessing(
      context,
      dto.status === 'approved' ? 'APPROVE_REQUEST' : 
      dto.status === 'rejected' ? 'REJECT_REQUEST' : 'CANCEL_REQUEST',
      requestId,
      {
        organizationName: request.organization.name,
        planName: request.subscriptionPlan.name,
        operationType: request.operationType,
        adminNotes: dto.adminNotes,
        effectiveDate: dto.effectiveDate,
      },
    );

    // If approved, create subscription operation and update organization
    if (dto.status === 'approved') {
      await this.executeSubscriptionChange(context, request, dto.effectiveDate);
    }

    return this.mapRequestToResponse(updatedRequest);
  }

  /**
   * Get subscription operations history
   */
  async getOperations(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<SubscriptionOperationResponseDto>> {
    const skip = (page - 1) * limit;

    const [operations, total] = await Promise.all([
      this.prisma.subscriptionOperation.findMany({
        skip,
        take: limit,
        include: {
          organization: {
            select: { name: true },
          },
          fromSubscriptionPlan: {
            select: { name: true },
          },
          toSubscriptionPlan: {
            select: { name: true },
          },
          executedBy: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.subscriptionOperation.count(),
    ]);

    const data = operations.map(this.mapOperationToResponse);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get cancellation requests
   */
  async getCancellations(): Promise<CancellationResponseDto[]> {
    const cancellations = await this.prisma.subscriptionCancellation.findMany({
      include: {
        organization: {
          select: { name: true },
        },
        subscriptionOrganization: {
          include: {
            subscriptionPlan: {
              select: { name: true },
            },
          },
        },
        requestedBy: {
          select: { name: true },
        },
        processedBy: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cancellations.map(this.mapCancellationToResponse);
  }

  /**
   * Execute subscription change (private helper method)
   */
  private async executeSubscriptionChange(
    context: IRequestContext,
    request: any,
    effectiveDate?: string,
  ): Promise<void> {
    const effectiveDateTime = effectiveDate ? new Date(effectiveDate) : new Date();

    await this.prisma.$transaction(async (prisma) => {
      // Get current active subscription if exists
      const currentSubscription = await prisma.subscriptionOrganization.findFirst({
        where: {
          organizationId: request.organizationId,
          isActive: true,
          deletedAt: null,
        },
      });

      // Deactivate current subscription
      if (currentSubscription) {
        await prisma.subscriptionOrganization.update({
          where: { id: currentSubscription.id },
          data: {
            isActive: false,
            updatedByUserId: context.getUserId(),
          },
        });
      }

      // Calculate new end date based on plan
      const plan = request.subscriptionPlan;
      let endDate = new Date(effectiveDateTime);
      if (plan.duration && plan.durationPeriod) {
        const duration = plan.duration;
        if (plan.durationPeriod === 'MONTH') {
          endDate.setMonth(endDate.getMonth() + duration);
        } else if (plan.durationPeriod === 'DAY') {
          endDate.setDate(endDate.getDate() + duration);
        }
      } else {
        // Default to 1 month
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create new subscription
      await prisma.subscriptionOrganization.create({
        data: {
          organizationId: request.organizationId,
          subscriptionPlanId: request.subscriptionPlanId,
          status: 'active',
          startDate: effectiveDateTime,
          endDate,
          isActive: true,
          createdByUserId: context.getUserId(),
        },
      });

      // Create operation record
      await prisma.subscriptionOperation.create({
        data: {
          organizationId: request.organizationId,
          fromSubscriptionPlanId: currentSubscription?.subscriptionPlanId,
          toSubscriptionPlanId: request.subscriptionPlanId,
          operationType: request.operationType,
          executedByUserId: context.getUserId(),
          effectiveDate: effectiveDateTime,
          previousEndDate: currentSubscription?.endDate,
          newEndDate: endDate,
          subscriptionRequestId: request.id,
          createdByUserId: context.getUserId(),
        },
      });
    });
  }

  /**
   * Map plan to response DTO
   */
  private mapPlanToResponse(plan: any, organizationCount: number): SubscriptionPlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingFrequency: plan.billingFrequency,
      duration: plan.duration,
      durationPeriod: plan.durationPeriod,
      maxGyms: plan.maxGyms,
      maxClientsPerGym: plan.maxClientsPerGym,
      maxUsersPerGym: plan.maxUsersPerGym,
      features: plan.features,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      organizationCount,
    };
  }

  /**
   * Map request to response DTO
   */
  private mapRequestToResponse(request: any): SubscriptionRequestResponseDto {
    return {
      id: request.id,
      organizationId: request.organizationId,
      organizationName: request.organization.name,
      subscriptionPlanId: request.subscriptionPlanId,
      subscriptionPlanName: request.subscriptionPlan.name,
      requestedByName: request.requestedBy.name,
      status: request.status,
      operationType: request.operationType,
      requestedStartDate: request.requestedStartDate,
      notes: request.notes,
      adminNotes: request.adminNotes,
      processedByName: request.processedBy?.name,
      processedAt: request.processedAt,
      createdAt: request.createdAt,
    };
  }

  /**
   * Map operation to response DTO
   */
  private mapOperationToResponse(operation: any): SubscriptionOperationResponseDto {
    return {
      id: operation.id,
      organizationId: operation.organizationId,
      organizationName: operation.organization.name,
      fromPlanName: operation.fromSubscriptionPlan?.name,
      toPlanName: operation.toSubscriptionPlan?.name,
      operationType: operation.operationType,
      executedByName: operation.executedBy.name,
      effectiveDate: operation.effectiveDate,
      previousEndDate: operation.previousEndDate,
      newEndDate: operation.newEndDate,
      prorationAmount: operation.prorationAmount ? parseFloat(operation.prorationAmount) : undefined,
      notes: operation.notes,
      createdAt: operation.createdAt,
    };
  }

  /**
   * Map cancellation to response DTO
   */
  private mapCancellationToResponse(cancellation: any): CancellationResponseDto {
    return {
      id: cancellation.id,
      organizationId: cancellation.organizationId,
      organizationName: cancellation.organization.name,
      subscriptionPlanName: cancellation.subscriptionOrganization.subscriptionPlan.name,
      requestedByName: cancellation.requestedBy.name,
      reason: cancellation.reason,
      reasonDescription: cancellation.reasonDescription,
      effectiveDate: cancellation.effectiveDate,
      refundAmount: cancellation.refundAmount ? parseFloat(cancellation.refundAmount) : undefined,
      retentionOffered: cancellation.retentionOffered,
      retentionDetails: cancellation.retentionDetails,
      processedByName: cancellation.processedBy?.name,
      processedAt: cancellation.processedAt,
      createdAt: cancellation.createdAt,
    };
  }

  /**
   * Process request with notifications and enhanced error handling
   */
  async processRequestWithNotifications(
    context: IRequestContext,
    requestId: string,
    dto: ProcessRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    this.logger.log(`Processing subscription request ${requestId} with notifications`);

    try {
      // Process the request first
      const result = await this.processRequest(context, requestId, dto);

      // Send notification (non-blocking)
      this.notificationService.notifyRequestProcessed(requestId, {
        organizationName: result.organizationName,
        planName: result.subscriptionPlanName,
        operationType: result.operationType,
        status: dto.status as 'approved' | 'rejected' | 'cancelled',
        adminNotes: dto.adminNotes,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        processedByName: context.getUserName() || 'System',
      }).catch(error => {
        this.logger.error(`Failed to send notification for request ${requestId}`, error);
        // Don't fail the main operation due to notification failure
      });

      this.logger.log(`Successfully processed subscription request ${requestId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process subscription request ${requestId}`, error);
      
      // Re-throw with additional context if needed
      if (error instanceof BusinessException || 
          error instanceof ResourceNotFoundException || 
          error instanceof ValidationException) {
        throw error;
      }
      
      // Wrap unexpected errors
      throw new BusinessException(
        `Failed to process subscription request: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get subscription requests with advanced filtering
   */
  async getRequests(
    query: RequestAnalyticsQueryDto,
  ): Promise<PaginatedResponse<SubscriptionRequestResponseDto>> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (query.status && query.status !== RequestStatusFilter.ALL) {
      where.status = query.status.toLowerCase();
    }

    if (query.operationType && query.operationType !== RequestOperationFilter.ALL) {
      where.operationType = query.operationType.toLowerCase();
    }

    if (query.organizationName) {
      where.organization = {
        name: {
          contains: query.organizationName,
          mode: 'insensitive',
        },
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [requests, total] = await Promise.all([
      this.prisma.subscriptionRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: { name: true },
          },
          subscriptionPlan: {
            select: { name: true },
          },
          requestedBy: {
            select: { name: true },
          },
          processedBy: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.subscriptionRequest.count({ where }),
    ]);

    const data = requests.map(this.mapRequestToResponse);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get request analytics with comprehensive error handling
   */
  async getRequestAnalytics(query: RequestAnalyticsQueryDto): Promise<RequestAnalyticsDto> {
    this.logger.log('Generating request analytics', { 
      period: query.startDate && query.endDate ? 'custom' : 'default',
      status: query.status,
      operationType: query.operationType,
    });

    try {
      const { startDate, endDate } = this.getAnalyticsDateRange(query);

    // Build base where clause
    const baseWhere: any = {
      deletedAt: null,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.organizationName) {
      baseWhere.organization = {
        name: {
          contains: query.organizationName,
          mode: 'insensitive',
        },
      };
    }

    // Get request metrics
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      cancelledRequests,
      requestsWithProcessingTime,
      stalePendingRequests,
    ] = await Promise.all([
      this.prisma.subscriptionRequest.count({ where: baseWhere }),
      this.prisma.subscriptionRequest.count({ 
        where: { ...baseWhere, status: 'pending' } 
      }),
      this.prisma.subscriptionRequest.count({ 
        where: { ...baseWhere, status: 'approved' } 
      }),
      this.prisma.subscriptionRequest.count({ 
        where: { ...baseWhere, status: 'rejected' } 
      }),
      this.prisma.subscriptionRequest.count({ 
        where: { ...baseWhere, status: 'cancelled' } 
      }),
      this.prisma.subscriptionRequest.findMany({
        where: {
          ...baseWhere,
          processedAt: { not: null },
        },
        select: {
          createdAt: true,
          processedAt: true,
        },
      }),
      this.prisma.subscriptionRequest.count({
        where: {
          status: 'pending',
          createdAt: {
            lte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
          deletedAt: null,
        },
      }),
    ]);

    // Calculate metrics
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
    
    let averageProcessingTime = 0;
    if (requestsWithProcessingTime.length > 0) {
      const totalProcessingTime = requestsWithProcessingTime.reduce((sum, request) => {
        if (request.processedAt) {
          const processingTime = request.processedAt.getTime() - request.createdAt.getTime();
          return sum + processingTime;
        }
        return sum;
      }, 0);
      averageProcessingTime = totalProcessingTime / requestsWithProcessingTime.length / (1000 * 60 * 60); // Convert to hours
    }

    const metrics = {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      cancelledRequests,
      approvalRate: Number(approvalRate.toFixed(2)),
      averageProcessingTime: Number(averageProcessingTime.toFixed(2)),
      stalePendingRequests,
    };

    // Get operation breakdown
    const operationBreakdown = await this.getRequestOperationBreakdown(baseWhere);

    // Get volume trend (last 30 days)
    const volumeTrend = await this.getRequestVolumeTrend(30);

      const result = {
        filters: query,
        metrics,
        operationBreakdown,
        volumeTrend,
        generatedAt: new Date().toISOString(),
      };

      this.logger.log('Successfully generated request analytics', {
        totalRequests: metrics.totalRequests,
        approvalRate: metrics.approvalRate,
        pendingRequests: metrics.pendingRequests,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to generate request analytics', error);
      throw new BusinessException(
        `Failed to generate request analytics: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Get organization subscription history
   */
  async getOrganizationSubscriptionHistory(
    organizationId: string,
    query: SubscriptionHistoryQueryDto,
  ): Promise<SubscriptionHistoryDto> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (query.operationType) {
      where.operationType = query.operationType;
    }

    const [operations, total] = await Promise.all([
      this.prisma.subscriptionOperation.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: { name: true },
          },
          fromSubscriptionPlan: {
            select: { name: true },
          },
          toSubscriptionPlan: {
            select: { name: true },
          },
          executedBy: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.subscriptionOperation.count({ where }),
    ]);

    const data = operations.map(operation => ({
      id: operation.id,
      organizationId: operation.organizationId,
      organizationName: operation.organization.name,
      fromPlanName: operation.fromSubscriptionPlan?.name,
      toPlanName: operation.toSubscriptionPlan?.name,
      operationType: operation.operationType,
      executedByName: operation.executedBy.name,
      effectiveDate: operation.effectiveDate.toISOString(),
      previousEndDate: operation.previousEndDate?.toISOString(),
      newEndDate: operation.newEndDate?.toISOString(),
      prorationAmount: operation.prorationAmount ? parseFloat(operation.prorationAmount.toString()) : undefined,
      notes: operation.notes,
      subscriptionRequestId: operation.subscriptionRequestId,
      metadata: operation.metadata,
      createdAt: operation.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get analytics date range
   */
  private getAnalyticsDateRange(query: RequestAnalyticsQueryDto): { startDate: Date; endDate: Date } {
    let startDate = new Date();
    let endDate = new Date();

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  /**
   * Get request operation breakdown
   */
  private async getRequestOperationBreakdown(baseWhere: any) {
    const operationTypes = ['upgrade', 'downgrade', 'renewal', 'cancellation', 'activation'];
    
    const breakdown = await Promise.all(
      operationTypes.map(async (operationType) => {
        const [total, approved] = await Promise.all([
          this.prisma.subscriptionRequest.count({
            where: { ...baseWhere, operationType },
          }),
          this.prisma.subscriptionRequest.count({
            where: { ...baseWhere, operationType, status: 'approved' },
          }),
        ]);

        const approvalRate = total > 0 ? (approved / total) * 100 : 0;
        
        // Get average processing time for this operation type
        const processedRequests = await this.prisma.subscriptionRequest.findMany({
          where: {
            ...baseWhere,
            operationType,
            processedAt: { not: null },
          },
          select: {
            createdAt: true,
            processedAt: true,
          },
        });

        let avgProcessingTime = 0;
        if (processedRequests.length > 0) {
          const totalTime = processedRequests.reduce((sum, request) => {
            if (request.processedAt) {
              return sum + (request.processedAt.getTime() - request.createdAt.getTime());
            }
            return sum;
          }, 0);
          avgProcessingTime = totalTime / processedRequests.length / (1000 * 60 * 60); // Hours
        }

        return {
          operationType,
          count: total,
          approvalRate: Number(approvalRate.toFixed(2)),
          avgProcessingTime: Number(avgProcessingTime.toFixed(2)),
        };
      })
    );

    return breakdown;
  }

  /**
   * Get request volume trend
   */
  private async getRequestVolumeTrend(days: number) {
    const trend = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [requests, approved, rejected, pending] = await Promise.all([
        this.prisma.subscriptionRequest.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            deletedAt: null,
          },
        }),
        this.prisma.subscriptionRequest.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: 'approved',
            deletedAt: null,
          },
        }),
        this.prisma.subscriptionRequest.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: 'rejected',
            deletedAt: null,
          },
        }),
        this.prisma.subscriptionRequest.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: 'pending',
            deletedAt: null,
          },
        }),
      ]);

      trend.push({
        date: dayStart.toISOString().split('T')[0],
        requests,
        approved,
        rejected,
        pending,
      });
    }

    return trend;
  }
}