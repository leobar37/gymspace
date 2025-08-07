import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto, SearchCheckInsDto } from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Check-ins')
@Controller('check-ins')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  @Allow(PERMISSIONS.CHECKINS_CREATE)
  @ApiOperation({ summary: 'Create a check-in for a client' })
  @ApiResponse({ status: 201, description: 'Check-in created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCheckIn(@Body() dto: CreateCheckInDto, @AppCtxt() ctx: RequestContext) {
    return await this.checkInsService.createCheckIn(ctx.getGymId()!, dto, ctx.getUserId());
  }

  @Get(':id')
  @Allow(PERMISSIONS.CHECKINS_READ)
  @ApiOperation({ summary: 'Get check-in details' })
  @ApiResponse({ status: 200, description: 'Check-in details' })
  @ApiResponse({ status: 404, description: 'Check-in not found' })
  async getCheckIn(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.checkInsService.getCheckIn(id, ctx.getUserId());
  }

  @Get()
  @Allow(PERMISSIONS.CHECKINS_READ)
  @ApiOperation({ summary: 'Search check-ins' })
  @ApiResponse({ status: 200, description: 'List of check-ins' })
  async searchCheckIns(@Query() dto: SearchCheckInsDto, @AppCtxt() ctx: RequestContext) {
    return await this.checkInsService.searchCheckIns(ctx.getGymId()!, dto, ctx.getUserId());
  }

  @Get('current')
  @Allow(PERMISSIONS.CHECKINS_READ)
  @ApiOperation({ summary: 'Get clients currently in the gym' })
  @ApiResponse({ status: 200, description: 'List of clients currently in gym' })
  async getCurrentlyInGym(@AppCtxt() ctx: RequestContext) {
    return await this.checkInsService.getCurrentlyInGym(ctx.getGymId()!, ctx.getUserId());
  }

  @Get('stats/:period')
  @Allow(PERMISSIONS.CHECKINS_READ)
  @ApiOperation({ summary: 'Get gym check-in statistics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Check-in statistics' })
  async getGymCheckInStats(
    @Param('period') period: 'day' | 'week' | 'month',
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.checkInsService.getGymCheckInStats(ctx.getGymId()!, ctx.getUserId(), period);
  }

  @Get('client/:clientId/history')
  @Allow(PERMISSIONS.CHECKINS_READ)
  @ApiOperation({ summary: 'Get client check-in history' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Client check-in history' })
  async getClientCheckInHistory(
    @Param('clientId') clientId: string,
    @Query('limit') limit: string,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.checkInsService.getClientCheckInHistory(
      clientId,
      ctx.getUserId(),
      limit ? parseInt(limit) : undefined,
    );
  }

  @Delete(':id')
  @Allow(PERMISSIONS.CHECKINS_CREATE)
  @ApiOperation({ summary: 'Delete a check-in (today only)' })
  @ApiResponse({ status: 200, description: 'Check-in deleted successfully' })
  @ApiResponse({ status: 404, description: 'Check-in not found' })
  @ApiResponse({ status: 400, description: "Can only delete today's check-ins" })
  async deleteCheckIn(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    await this.checkInsService.deleteCheckIn(id, ctx.getUserId());
    return { message: 'Check-in deleted successfully' };
  }
}
