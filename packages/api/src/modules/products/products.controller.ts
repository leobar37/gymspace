import { Controller, Get, Post, Put, Delete, Param, Body, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  SearchProductsDto, 
  CreateProductCategoryDto, 
  UpdateProductCategoryDto,
  UpdateStockDto
} from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Product Categories Endpoints
  @Post('categories')
  @Allow(PERMISSIONS.PRODUCT_CATEGORIES_CREATE)
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async createCategory(@Body() dto: CreateProductCategoryDto, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.createCategory(ctx, dto);
  }

  @Get('categories')
  @Allow(PERMISSIONS.PRODUCT_CATEGORIES_READ)
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories(@AppCtxt() ctx: RequestContext) {
    return await this.productsService.getCategories(ctx);
  }

  @Put('categories/:id')
  @Allow(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE)
  @ApiOperation({ summary: 'Update product category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.productsService.updateCategory(ctx, id, dto);
  }

  @Delete('categories/:id')
  @Allow(PERMISSIONS.PRODUCT_CATEGORIES_DELETE)
  @ApiOperation({ summary: 'Delete product category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete category with products' })
  async deleteCategory(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.deleteCategory(ctx, id);
  }

  // Product Endpoints
  @Post()
  @Allow(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Product name already exists' })
  async createProduct(@Body() dto: CreateProductDto, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.createProduct(ctx, dto);
  }

  @Get()
  @Allow(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Search products with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  async searchProducts(@Query() dto: SearchProductsDto, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.searchProducts(ctx, dto);
  }

  @Get('low-stock')
  @Allow(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'List of products with low stock' })
  async getLowStockProducts(
    @Query('threshold') threshold: string = '10',
    @AppCtxt() ctx: RequestContext,
  ) {
    const thresholdNumber = parseInt(threshold, 10) || 10;
    return await this.productsService.getLowStockProducts(ctx, thresholdNumber);
  }

  @Get(':id')
  @Allow(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Get product details' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.getProduct(ctx, id);
  }

  @Put(':id')
  @Allow(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update product information' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product name already exists' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.productsService.updateProduct(ctx, id, dto);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.deleteProduct(ctx, id);
  }

  @Patch(':id/toggle-status')
  @Allow(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Toggle product active/inactive status' })
  @ApiResponse({ status: 200, description: 'Product status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async toggleProductStatus(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.productsService.toggleProductStatus(ctx, id);
  }

  @Patch(':id/stock')
  @Allow(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update product stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.productsService.updateStock(ctx, id, dto.quantity);
  }
}