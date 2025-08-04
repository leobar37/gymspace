import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { GymMembershipPlansService } from './membership-plans.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';
import { Allow, RequestContext } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Membership Plans')
@Controller('membership-plans')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class MembershipPlansController {
  constructor(private readonly membershipPlansService: GymMembershipPlansService) {}

  @Post()
  @Allow(PERMISSIONS.GYMS_UPDATE)
  @ApiOperation({ summary: 'Create a new membership plan' })
  @ApiResponse({ status: 201, description: 'Membership plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createMembershipPlan(
    @Body() dto: CreateMembershipPlanDto,
    @RequestContext() ctx: RequestContext,
  ) {
    return await this.membershipPlansService.createGymMembershipPlan(
      ctx.getGymId()!,
      dto,
      ctx.getUserId(),
    );
  }

  @Get(':id')
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiOperation({ summary: 'Get membership plan details' })
  @ApiResponse({ status: 200, description: 'Membership plan details' })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  async getMembershipPlan(@Param('id') id: string, @RequestContext() ctx: RequestContext) {
    return await this.membershipPlansService.getGymMembershipPlan(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.GYMS_UPDATE)
  @ApiOperation({ summary: 'Update membership plan' })
  @ApiResponse({ status: 200, description: 'Membership plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  async updateMembershipPlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
    @RequestContext() ctx: RequestContext,
  ) {
    return await this.membershipPlansService.updateGymMembershipPlan(id, dto, ctx.getUserId());
  }

  @Get()
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiOperation({ summary: 'Get all membership plans for gym' })
  @ApiResponse({ status: 200, description: 'List of membership plans' })
  async getGymMembershipPlans(
    @Query('activeOnly') activeOnly: string,
    @RequestContext() ctx: RequestContext,
  ) {
    return await this.membershipPlansService.getGymGymMembershipPlans(
      ctx.getGymId()!,
      ctx.getUserId(),
      activeOnly === 'true',
    );
  }

  @Get(':id/stats')
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiOperation({ summary: 'Get membership plan statistics' })
  @ApiResponse({ status: 200, description: 'Membership plan statistics' })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  async getMembershipPlanStats(
    @Param('id') id: string,
    @RequestContext() ctx: RequestContext,
  ) {
    return await this.membershipPlansService.getGymMembershipPlanStats(id, ctx.getUserId());
  }

  @Delete(':id')
  @Allow(PERMISSIONS.GYMS_UPDATE)
  @ApiOperation({ summary: 'Delete membership plan (soft delete)' })
  @ApiResponse({ status: 200, description: 'Membership plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete plan with active contracts' })
  async deleteMembershipPlan(
    @Param('id') id: string,
    @RequestContext() ctx: RequestContext,
  ) {
    return await this.membershipPlansService.deleteGymMembershipPlan(id, ctx.getUserId());
  }
}
