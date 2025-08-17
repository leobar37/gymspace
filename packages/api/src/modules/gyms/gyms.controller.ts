import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { GymsService } from './gyms.service';
import { CreateGymDto, UpdateGymDto, UpdateCurrentGymDto } from './dto';
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
  async createGym(@AppCtxt() ctx: RequestContext, @Body() dto: CreateGymDto) {
    return await this.gymsService.createGym(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get gyms for organization' })
  @ApiResponse({ status: 200, description: 'List of gyms' })
  async getOrganizationGyms(@AppCtxt() ctx: RequestContext) {
    return await this.gymsService.getOrganizationGyms(ctx);
  }

  @Put('current')
  @Allow(PERMISSIONS.GYMS_UPDATE)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Update current gym in session' })
  @ApiResponse({ status: 200, description: 'Current gym updated successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async updateCurrentGym(@AppCtxt() ctx: RequestContext, @Body() dto: UpdateCurrentGymDto) {
    return await this.gymsService.updateCurrentGym(ctx, dto);
  }

  @Get(':id')
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Get gym details' })
  @ApiResponse({ status: 200, description: 'Gym details' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async getGym(@AppCtxt() ctx: RequestContext, @Param('id') id: string) {
    return await this.gymsService.getGym(ctx, id);
  }

  @Put(':id')
  @Allow(PERMISSIONS.GYMS_UPDATE)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Update gym details' })
  @ApiResponse({ status: 200, description: 'Gym updated successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async updateGym(
    @AppCtxt() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: UpdateGymDto,
  ) {
    return await this.gymsService.updateGym(ctx, id, dto);
  }

  @Get(':id/stats')
  @Allow(PERMISSIONS.GYMS_READ)
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Get gym statistics' })
  @ApiResponse({ status: 200, description: 'Gym statistics' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async getGymStats(@AppCtxt() ctx: RequestContext, @Param('id') id: string) {
    return await this.gymsService.getGymStats(ctx, id);
  }

  @Put(':id/toggle-status')
  @Allow(PERMISSIONS.GYMS_DELETE)
  @ApiOperation({ summary: 'Toggle gym active status' })
  @ApiResponse({ status: 200, description: 'Gym status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async toggleGymStatus(@AppCtxt() ctx: RequestContext, @Param('id') id: string) {
    return await this.gymsService.toggleGymStatus(ctx, id);
  }
}
