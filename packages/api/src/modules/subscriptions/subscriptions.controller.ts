import { IRequestContext, PERMISSIONS } from '@gymspace/shared';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Allow } from '../../common/decorators/allow.decorator';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import {
  AffiliateOrganizationDto,
  AvailablePlanDto,
  SubscriptionStatusDto,
} from './dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@ApiTags('Subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Allow(PERMISSIONS.GYMS_READ) // Subscription plans are gym-scoped
  @ApiOperation({ summary: 'Get available subscription plans (currently only free plans)' })
  @ApiResponse({
    status: 200,
    description: 'List of available subscription plans',
    type: [AvailablePlanDto],
  })
  async getAvailablePlans(
    @RequestContext() context: IRequestContext,
  ): Promise<AvailablePlanDto[]> {
    return this.subscriptionsService.getAvailablePlans();
  }

  @Get('organizations/:organizationId/status')
  @Allow(PERMISSIONS.ORGANIZATIONS_READ)
  @ApiOperation({ summary: 'Get subscription status for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription status',
    type: SubscriptionStatusDto,
  })
  async getSubscriptionStatus(
    @Param('organizationId') organizationId: string,
    @RequestContext() context: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    return this.subscriptionsService.getSubscriptionStatus(organizationId, context);
  }

  @Post('organizations/:organizationId/affiliate')
  @Allow(PERMISSIONS.ORGANIZATIONS_UPDATE)
  @ApiOperation({ 
    summary: 'Affiliate organization to a subscription plan',
    description: 'Currently only allows affiliation to free plans. The organization owner must perform this action.'
  })
  @ApiResponse({
    status: 200,
    description: 'Updated subscription status',
    type: SubscriptionStatusDto,
  })
  async affiliateOrganization(
    @Param('organizationId') organizationId: string,
    @Body() dto: AffiliateOrganizationDto,
    @RequestContext() context: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    return this.subscriptionsService.affiliateOrganization(
      organizationId,
      dto,
      context,
    );
  }

  @Get('organizations/:organizationId/limits/:limitType')
  @Allow(PERMISSIONS.ORGANIZATIONS_READ)
  @ApiOperation({ 
    summary: 'Check subscription limits',
    description: 'Check if an organization can perform an action based on subscription limits. Limit types: gyms, clients, users'
  })
  @ApiResponse({
    status: 200,
    description: 'Limit check result',
    schema: {
      type: 'object',
      properties: {
        canPerform: { type: 'boolean' },
        currentUsage: { type: 'number' },
        limit: { type: 'number' },
        message: { type: 'string', nullable: true },
      },
    },
  })
  async checkSubscriptionLimit(
    @Param('organizationId') organizationId: string,
    @Param('limitType') limitType: 'gyms' | 'clients' | 'users',
    @RequestContext() context: IRequestContext,
  ) {
    const gymId = context.getGymId();
    return this.subscriptionsService.checkSubscriptionLimit(
      organizationId,
      limitType,
      gymId,
    );
  }
}