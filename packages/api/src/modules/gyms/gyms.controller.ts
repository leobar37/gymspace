import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { GymsService } from './gyms.service';
import { CreateGymDto, UpdateGymDto } from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Gyms')
@Controller('gyms')
@ApiBearerAuth()
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Post()
  @Allow(PERMISSIONS.GYMS_CREATE)
  @ApiOperation({ summary: 'Create a new gym' })
  @ApiResponse({ status: 201, description: 'Gym created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Gym limit reached' })
  async createGym(
    @Query('organizationId') organizationId: string,
    @Body() dto: CreateGymDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.gymsService.createGym(organizationId, dto, ctx.getUserId());
  }

  @Get(':id')
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Get gym details' })
  @ApiResponse({ status: 200, description: 'Gym details' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async getGym(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.gymsService.getGym(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.GYMS_UPDATE)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Update gym details' })
  @ApiResponse({ status: 200, description: 'Gym updated successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async updateGym(
    @Param('id') id: string,
    @Body() dto: UpdateGymDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.gymsService.updateGym(id, dto, ctx.getUserId());
  }

  @Get()
  @ApiOperation({ summary: 'Get gyms for organization' })
  @ApiResponse({ status: 200, description: 'List of gyms' })
  async getOrganizationGyms(
    @Query('organizationId') organizationId: string,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.gymsService.getOrganizationGyms(organizationId, ctx.getUserId());
  }

  @Get(':id/stats')
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Get gym statistics' })
  @ApiResponse({ status: 200, description: 'Gym statistics' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async getGymStats(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.gymsService.getGymStats(id, ctx.getUserId());
  }

  @Put(':id/toggle-status')
  @Allow(PERMISSIONS.GYMS_DELETE)
  @ApiOperation({ summary: 'Toggle gym active status' })
  @ApiResponse({ status: 200, description: 'Gym status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async toggleGymStatus(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.gymsService.toggleGymStatus(id, ctx.getUserId());
  }
}
