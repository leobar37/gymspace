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
import {
  DashboardStatsDto,
  ExpiringContractDto,
  ContractsRevenueDto,
  SalesRevenueDto,
  DebtsDto,
  CheckInsDto,
  NewClientsDto,
} from './dto';
import { DateRangeQueryDto } from 'src/common/dto';

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
    description: 'Get lightweight statistics for the gym dashboard (counts only, no revenue)',
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

  @Get('contracts-revenue')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get contracts revenue',
    description: 'Get revenue from contracts within the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Contracts revenue data',
    type: ContractsRevenueDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getContractsRevenue(
    @AppCtxt() ctx: RequestContext,
    @Query() query: DateRangeQueryDto,
  ): Promise<ContractsRevenueDto> {
    return await this.dashboardService.getContractsRevenue(
      ctx,
      query.startDate,
      query.endDate,
    );
  }

  @Get('sales-revenue')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get sales revenue',
    description: 'Get revenue from product sales within the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales revenue data',
    type: SalesRevenueDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSalesRevenue(
    @AppCtxt() ctx: RequestContext,
    @Query() query: DateRangeQueryDto,
  ): Promise<SalesRevenueDto> {
    return await this.dashboardService.getSalesRevenue(ctx, query.startDate, query.endDate);
  }

  @Get('debts')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get total debts',
    description: 'Get outstanding debts within the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Debts data',
    type: DebtsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDebts(
    @AppCtxt() ctx: RequestContext,
    @Query() query: DateRangeQueryDto,
  ): Promise<DebtsDto> {
    return await this.dashboardService.getDebts(ctx, query.startDate, query.endDate);
  }

  @Get('check-ins')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get check-ins count',
    description: 'Get check-ins count within the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-ins data',
    type: CheckInsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCheckIns(
    @AppCtxt() ctx: RequestContext,
    @Query() query: DateRangeQueryDto,
  ): Promise<CheckInsDto> {
    return await this.dashboardService.getCheckIns(ctx, query.startDate, query.endDate);
  }

  @Get('new-clients')
  @Allow(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({
    summary: 'Get new clients count',
    description: 'Get new clients count within the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'New clients data',
    type: NewClientsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getNewClients(
    @AppCtxt() ctx: RequestContext,
    @Query() query: DateRangeQueryDto,
  ): Promise<NewClientsDto> {
    return await this.dashboardService.getNewClients(ctx, query.startDate, query.endDate);
  }

  @Get('expiring-contracts')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({
    summary: 'Get expiring contracts',
    description: 'Get contracts that are expiring within the specified date range',
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
    @Query() query: DateRangeQueryDto,
    @Query('limit') limit?: string,
  ): Promise<ExpiringContractDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.dashboardService.getExpiringContracts(
      ctx,
      limitNum,
      query.startDate,
      query.endDate,
    );
  }
}
