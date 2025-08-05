import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';
import { DashboardStatsDto, RecentActivityDto, ExpiringContractDto } from './dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Get aggregated statistics for the gym dashboard including clients, contracts, revenue, and check-ins',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboardStats(@AppCtxt() ctx: RequestContext): Promise<DashboardStatsDto> {
    return await this.dashboardService.getDashboardStats(ctx);
  }

  @Get('recent-activity')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get recent activity',
    description: 'Get recent activities in the gym including check-ins, new clients, and contracts',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of activities to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of recent activities',
    type: [RecentActivityDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRecentActivity(
    @AppCtxt() ctx: RequestContext,
    @Query('limit') limit?: string,
  ): Promise<RecentActivityDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.dashboardService.getRecentActivity(ctx, limitNum);
  }

  @Get('expiring-contracts')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({
    summary: 'Get expiring contracts',
    description: 'Get contracts that are expiring in the next 30 days',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of contracts to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of expiring contracts',
    type: [ExpiringContractDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getExpiringContracts(
    @AppCtxt() ctx: RequestContext,
    @Query('limit') limit?: string,
  ): Promise<ExpiringContractDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.dashboardService.getExpiringContracts(ctx, limitNum);
  }
}
