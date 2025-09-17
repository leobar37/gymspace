import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IRequestContext, PERMISSIONS, PaginatedResponse } from '@gymspace/shared';
import { AppCtxt } from '../../../common/decorators/app-context.decorator';
import { Admin } from '../../../common/decorators/admin.decorator';
import { AdminSubscriptionService } from '../services/admin-subscription.service';
import { SubscriptionAnalyticsService } from '../services/subscription-analytics.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  SubscriptionPlanResponseDto,
  SubscriptionRequestResponseDto,
  ProcessRequestDto,
  SubscriptionOperationResponseDto,
  CancellationResponseDto,
  SubscriptionAnalyticsDto,
  SubscriptionAnalyticsQueryDto,
  RevenueAnalyticsDto,
  UsageTrendsDto,
  SubscriptionHistoryDto,
  SubscriptionHistoryQueryDto,
  RequestAnalyticsDto,
  RequestAnalyticsQueryDto,
} from '../dto/admin';

@ApiTags('Admin - Subscription Management')
@Controller('admin/subscriptions')
@ApiBearerAuth()
export class AdminSubscriptionController {
  constructor(
    private readonly adminSubscriptionService: AdminSubscriptionService,
    private readonly analyticsService: SubscriptionAnalyticsService,
  ) {}

  // Subscription Plans Management

  @Post('plans')
  @Admin(PERMISSIONS.SUBSCRIPTION_PLANS_CREATE)
  @ApiOperation({
    summary: 'Create a new subscription plan',
    description: 'Create a new subscription plan with pricing and feature configuration',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created successfully',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan data or name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async createPlan(
    @AppCtxt() context: IRequestContext,
    @Body() dto: CreatePlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.adminSubscriptionService.createPlan(context, dto);
  }

  @Get('plans')
  @Admin(PERMISSIONS.SUBSCRIPTION_PLANS_READ)
  @ApiOperation({
    summary: 'Get all subscription plans',
    description: 'Retrieve all subscription plans with usage statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans',
    type: [SubscriptionPlanResponseDto],
  })
  async getPlans(): Promise<SubscriptionPlanResponseDto[]> {
    return this.adminSubscriptionService.getPlans();
  }

  @Get('plans/:planId')
  @Admin(PERMISSIONS.SUBSCRIPTION_PLANS_READ)
  @ApiOperation({
    summary: 'Get subscription plan by ID',
    description: 'Retrieve a specific subscription plan with usage statistics',
  })
  @ApiParam({
    name: 'planId',
    description: 'Subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan details',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  async getPlanById(
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.adminSubscriptionService.getPlanById(planId);
  }

  @Put('plans/:planId')
  @Admin(PERMISSIONS.SUBSCRIPTION_PLANS_UPDATE)
  @ApiOperation({
    summary: 'Update subscription plan',
    description: 'Update an existing subscription plan configuration',
  })
  @ApiParam({
    name: 'planId',
    description: 'Subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated successfully',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data or name conflict',
  })
  async updatePlan(
    @AppCtxt() context: IRequestContext,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.adminSubscriptionService.updatePlan(context, planId, dto);
  }

  @Delete('plans/:planId')
  @Admin(PERMISSIONS.SUBSCRIPTION_PLANS_DELETE)
  @ApiOperation({
    summary: 'Delete subscription plan',
    description: 'Soft delete a subscription plan (only if not in use)',
  })
  @ApiParam({
    name: 'planId',
    description: 'Subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Subscription plan deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete plan that is in use',
  })
  async deletePlan(
    @AppCtxt() context: IRequestContext,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<void> {
    return this.adminSubscriptionService.deletePlan(context, planId);
  }

  // Subscription Requests Management

  @Get('requests/pending')
  @Admin(PERMISSIONS.SUBSCRIPTION_REQUESTS_READ)
  @ApiOperation({
    summary: 'Get pending subscription requests',
    description: 'Retrieve all pending subscription change requests',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending subscription requests',
    type: [SubscriptionRequestResponseDto],
  })
  async getPendingRequests(): Promise<SubscriptionRequestResponseDto[]> {
    return this.adminSubscriptionService.getPendingRequests();
  }

  @Post('requests/:requestId/process')
  @Admin(PERMISSIONS.SUBSCRIPTION_REQUESTS_PROCESS)
  @ApiOperation({
    summary: 'Process subscription request',
    description: 'Approve, reject, or cancel a subscription change request',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Subscription request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription request processed successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription request not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Request cannot be processed (already processed)',
  })
  async processRequest(
    @AppCtxt() context: IRequestContext,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: ProcessRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.adminSubscriptionService.processRequest(context, requestId, dto);
  }

  // Subscription Operations History

  @Get('operations')
  @Admin(PERMISSIONS.SUBSCRIPTION_OPERATIONS_READ)
  @ApiOperation({
    summary: 'Get subscription operations history',
    description: 'Retrieve paginated history of all subscription operations',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of subscription operations',
  })
  async getOperations(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PaginatedResponse<SubscriptionOperationResponseDto>> {
    return this.adminSubscriptionService.getOperations(page, limit);
  }

  // Subscription Cancellations

  @Get('cancellations')
  @Admin(PERMISSIONS.SUBSCRIPTION_CANCELLATIONS_READ)
  @ApiOperation({
    summary: 'Get subscription cancellations',
    description: 'Retrieve all subscription cancellation requests and their status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscription cancellations',
    type: [CancellationResponseDto],
  })
  async getCancellations(): Promise<CancellationResponseDto[]> {
    return this.adminSubscriptionService.getCancellations();
  }

  // Analytics Endpoints

  @Get('analytics/subscriptions')
  @Admin(PERMISSIONS.SUBSCRIPTION_ANALYTICS_READ)
  @ApiOperation({
    summary: 'Get subscription analytics',
    description: 'Retrieve comprehensive subscription analytics including metrics, trends, and plan usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription analytics data',
    type: SubscriptionAnalyticsDto,
  })
  async getSubscriptionAnalytics(
    @Query() query: SubscriptionAnalyticsQueryDto,
  ): Promise<SubscriptionAnalyticsDto> {
    return this.analyticsService.getSubscriptionAnalytics(query);
  }

  @Get('analytics/revenue')
  @Admin(PERMISSIONS.SUBSCRIPTION_ANALYTICS_READ)
  @ApiOperation({
    summary: 'Get revenue analytics',
    description: 'Retrieve revenue analytics including MRR, ARR, plan breakdown, and trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics data',
    type: RevenueAnalyticsDto,
  })
  async getRevenueAnalytics(
    @Query() query: SubscriptionAnalyticsQueryDto,
  ): Promise<RevenueAnalyticsDto> {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('analytics/usage-trends')
  @Admin(PERMISSIONS.SUBSCRIPTION_ANALYTICS_READ)
  @ApiOperation({
    summary: 'Get usage trends analytics',
    description: 'Retrieve usage trends and organization utilization patterns',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage trends analytics data',
    type: UsageTrendsDto,
  })
  async getUsageTrends(
    @Query() query: SubscriptionAnalyticsQueryDto,
  ): Promise<UsageTrendsDto> {
    return this.analyticsService.getUsageTrends(query);
  }

  @Get('analytics/requests')
  @Admin(PERMISSIONS.SUBSCRIPTION_REQUESTS_READ)
  @ApiOperation({
    summary: 'Get subscription request analytics',
    description: 'Retrieve analytics on subscription requests including processing metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Request analytics data',
    type: RequestAnalyticsDto,
  })
  async getRequestAnalytics(
    @Query() query: RequestAnalyticsQueryDto,
  ): Promise<RequestAnalyticsDto> {
    return this.adminSubscriptionService.getRequestAnalytics(query);
  }

  // Enhanced Request Management

  @Get('requests')
  @Admin(PERMISSIONS.SUBSCRIPTION_REQUESTS_READ)
  @ApiOperation({
    summary: 'Get subscription requests with filtering',
    description: 'Retrieve subscription requests with advanced filtering and search capabilities',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of subscription requests',
  })
  async getRequests(
    @Query() query: RequestAnalyticsQueryDto,
  ): Promise<PaginatedResponse<SubscriptionRequestResponseDto>> {
    return this.adminSubscriptionService.getRequests(query);
  }

  @Put('requests/:requestId/process')
  @Admin(PERMISSIONS.SUBSCRIPTION_REQUESTS_PROCESS)
  @ApiOperation({
    summary: 'Process subscription request with enhanced workflow',
    description: 'Process subscription request with email notifications and improved workflow tracking',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Subscription request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription request processed successfully with notifications sent',
    type: SubscriptionRequestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription request not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Request cannot be processed (already processed or invalid state)',
  })
  async processRequestEnhanced(
    @AppCtxt() context: IRequestContext,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: ProcessRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.adminSubscriptionService.processRequestWithNotifications(context, requestId, dto);
  }

  // Subscription History

  @Get('organizations/:organizationId/subscription-history')
  @Admin(PERMISSIONS.SUBSCRIPTION_OPERATIONS_READ)
  @ApiOperation({
    summary: 'Get subscription history for organization',
    description: 'Retrieve complete subscription history for a specific organization',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization subscription history',
    type: SubscriptionHistoryDto,
  })
  async getOrganizationSubscriptionHistory(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: SubscriptionHistoryQueryDto,
  ): Promise<SubscriptionHistoryDto> {
    return this.adminSubscriptionService.getOrganizationSubscriptionHistory(organizationId, query);
  }
}