import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { 
  CreateSupplierDto, 
  UpdateSupplierDto, 
  SearchSuppliersDto 
} from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Suppliers')
@Controller('suppliers')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Allow(PERMISSIONS.SUPPLIERS_CREATE)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Supplier name or email already exists' })
  async createSupplier(@Body() dto: CreateSupplierDto, @AppCtxt() ctx: RequestContext) {
    return await this.suppliersService.createSupplier(ctx.getGymId()!, dto, ctx.getUserId()!);
  }

  @Get()
  @Allow(PERMISSIONS.SUPPLIERS_READ)
  @ApiOperation({ summary: 'Search suppliers with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of suppliers' })
  async searchSuppliers(@Query() dto: SearchSuppliersDto, @AppCtxt() ctx: RequestContext) {
    return await this.suppliersService.searchSuppliers(ctx.getGymId()!, dto, ctx.getUserId()!);
  }

  @Get('stats')
  @Allow(PERMISSIONS.SUPPLIERS_READ)
  @ApiOperation({ summary: 'Get supplier statistics' })
  @ApiResponse({ status: 200, description: 'Supplier statistics including contact completeness' })
  async getSupplierStats(@AppCtxt() ctx: RequestContext) {
    return await this.suppliersService.getSupplierStats(ctx.getGymId()!);
  }

  @Get(':id')
  @Allow(PERMISSIONS.SUPPLIERS_READ)
  @ApiOperation({ summary: 'Get supplier details' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplier(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.suppliersService.getSupplier(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.SUPPLIERS_UPDATE)
  @ApiOperation({ summary: 'Update supplier information' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 409, description: 'Supplier name or email already exists' })
  async updateSupplier(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.suppliersService.updateSupplier(id, dto, ctx.getUserId()!);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.SUPPLIERS_DELETE)
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async deleteSupplier(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.suppliersService.deleteSupplier(id, ctx.getUserId()!);
  }
}