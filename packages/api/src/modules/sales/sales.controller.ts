import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, SearchSalesDto, UpdatePaymentStatusDto } from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Sales')
@Controller('sales')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Allow(PERMISSIONS.SALES_CREATE)
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Insufficient stock or invalid product' })
  async createSale(@Body() dto: CreateSaleDto, @AppCtxt() ctx: RequestContext) {
    return await this.salesService.createSale(ctx.getGymId()!, dto, ctx.getUserId()!);
  }

  @Get()
  @Allow(PERMISSIONS.SALES_READ)
  @ApiOperation({ summary: 'Search sales with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of sales' })
  async searchSales(@Query() dto: SearchSalesDto, @AppCtxt() ctx: RequestContext) {
    return await this.salesService.searchSales(ctx.getGymId()!, dto, ctx.getUserId()!);
  }

  @Get('stats')
  @Allow(PERMISSIONS.SALES_READ)
  @ApiOperation({ summary: 'Get sales statistics' })
  @ApiResponse({ status: 200, description: 'Sales statistics' })
  async getSalesStats(
    @AppCtxt() ctx: RequestContext,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.salesService.getSalesStats(ctx.getGymId()!, start, end);
  }

  @Get('top-products')
  @Allow(PERMISSIONS.SALES_READ)
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({ status: 200, description: 'Top selling products with statistics' })
  async getTopSellingProducts(
    @AppCtxt() ctx: RequestContext,
    @Query('limit') limit: string = '10',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNumber = parseInt(limit, 10) || 10;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.salesService.getTopSellingProducts(ctx.getGymId()!, limitNumber, start, end);
  }

  @Get(':id')
  @Allow(PERMISSIONS.SALES_READ)
  @ApiOperation({ summary: 'Get sale details' })
  @ApiResponse({ status: 200, description: 'Sale details with items' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async getSale(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.salesService.getSale(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.SALES_UPDATE)
  @ApiOperation({ summary: 'Update sale information' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async updateSale(
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.salesService.updateSale(id, dto, ctx.getUserId()!);
  }

  @Put(':id/payment-status')
  @Allow(PERMISSIONS.SALES_UPDATE)
  @ApiOperation({ summary: 'Update sale payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.salesService.updatePaymentStatus(id, dto, ctx.getUserId()!);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.SALES_DELETE)
  @ApiOperation({ summary: 'Delete sale and restore stock' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async deleteSale(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.salesService.deleteSale(id, ctx.getUserId()!);
  }
}
