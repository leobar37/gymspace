import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicCatalogService } from './public-catalog.service';
import { SearchCatalogDto } from './dto';
import { Public } from '../../common/decorators';

@ApiTags('Public Catalog')
@Controller('catalog')
@Public() // All catalog endpoints are public
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search gyms in public catalog' })
  @ApiResponse({ status: 200, description: 'List of gyms matching search criteria' })
  async searchCatalog(@Query() dto: SearchCatalogDto) {
    return await this.publicCatalogService.searchCatalog(dto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured gyms' })
  @ApiResponse({ status: 200, description: 'List of featured gyms' })
  async getFeaturedGyms(@Query('limit') limit?: string) {
    return await this.publicCatalogService.getFeaturedGyms(limit ? parseInt(limit) : undefined);
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get cities with available gyms' })
  @ApiResponse({ status: 200, description: 'List of cities with gym count' })
  async getCitiesWithGyms() {
    return await this.publicCatalogService.getCitiesWithGyms();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get gym public details by slug' })
  @ApiResponse({ status: 200, description: 'Gym public details' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async getGymBySlug(@Param('slug') slug: string) {
    return await this.publicCatalogService.getGymBySlug(slug);
  }
}
