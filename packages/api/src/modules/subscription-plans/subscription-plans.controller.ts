import { IRequestContext, PERMISSIONS } from '@gymspace/shared';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
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
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanDto,
} from './dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@Controller('admin/subscription-plans')
@ApiTags('Admin - Subscription Plans')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class SubscriptionPlansController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Get()
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans',
    type: [SubscriptionPlanDto],
  })
  async listPlans(@AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto[]> {
    return await this.subscriptionPlansService.listPlans(ctx);
  }

  @Post()
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new subscription plan' })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created successfully',
    type: SubscriptionPlanDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate name',
  })
  async createPlan(
    @Body() dto: CreateSubscriptionPlanDto,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionPlanDto> {
    return await this.subscriptionPlansService.createPlan(ctx, dto);
  }

  @Get(':id')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get subscription plan details' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan details',
    type: SubscriptionPlanDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  async getPlan(
    @Param('id') id: string,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionPlanDto> {
    return await this.subscriptionPlansService.getPlan(ctx, id);
  }

  @Put(':id')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated successfully',
    type: SubscriptionPlanDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate name',
  })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<SubscriptionPlanDto> {
    return await this.subscriptionPlansService.updatePlan(ctx, id, dto);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete plan with active subscriptions',
  })
  async deletePlan(
    @Param('id') id: string,
    @AppCtxt() ctx: IRequestContext,
  ): Promise<{ success: boolean }> {
    return await this.subscriptionPlansService.deletePlan(ctx, id);
  }
}