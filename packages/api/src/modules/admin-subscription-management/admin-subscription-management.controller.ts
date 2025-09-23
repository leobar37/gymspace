import { IRequestContext, PERMISSIONS } from '@gymspace/shared';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { Allow } from '../../common/decorators/allow.decorator';
import { AppCtxt } from '../../common/decorators/request-context.decorator';
import {
  ActivateRenewalDto,
  CancelSubscriptionDto,
  UpgradeSubscriptionDto,
  SubscriptionStatusDto,
  SubscriptionHistoryDto,
} from './dto';
import { AdminSubscriptionManagementService } from './admin-subscription-management.service';

@Controller('admin/organizations/:organizationId/subscriptions')
@ApiTags('Admin - Subscription Management')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class AdminSubscriptionManagementController {
  constructor(
    private readonly adminSubscriptionManagementService: AdminSubscriptionManagementService,
  ) {}

  @Post('activate-renewal')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate subscription renewal' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewal activated successfully',
    type: SubscriptionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Organization or subscription not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  async activateRenewal(
    @Param('organizationId') organizationId: string,
    @Body() dto: ActivateRenewalDto,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    return await this.adminSubscriptionManagementService.activateRenewal(
      ctx,
      organizationId,
      dto,
    );
  }

  @Post('cancel')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel subscription with reason' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
    type: SubscriptionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Organization or subscription not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  async cancelSubscription(
    @Param('organizationId') organizationId: string,
    @Body() dto: CancelSubscriptionDto,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    return await this.adminSubscriptionManagementService.cancelSubscription(
      ctx,
      organizationId,
      dto,
    );
  }

  @Post('upgrade')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Upgrade subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
    type: SubscriptionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Organization, subscription, or plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or organization exceeds new plan limits',
  })
  async upgradeSubscription(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpgradeSubscriptionDto,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    return await this.adminSubscriptionManagementService.upgradeSubscription(
      ctx,
      organizationId,
      dto,
    );
  }

  @Get('history')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get subscription history' })
  @ApiResponse({
    status: 200,
    description: 'Subscription history retrieved successfully',
    type: [SubscriptionHistoryDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found',
  })
  async getSubscriptionHistory(
    @Param('organizationId') organizationId: string,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionHistoryDto[]> {
    return await this.adminSubscriptionManagementService.getSubscriptionHistory(
      ctx,
      organizationId,
    );
  }
}