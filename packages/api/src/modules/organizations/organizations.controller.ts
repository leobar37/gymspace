import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto, ListOrganizationsResponseDto } from './dto';
import { AppCtxt, Allow } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('list')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all organizations (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all organizations with owner and gyms',
    type: [ListOrganizationsResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Super admin access required' })
  async listOrganizations(@AppCtxt() ctx: RequestContext): Promise<ListOrganizationsResponseDto[]> {
    return await this.organizationsService.listOrganizations(ctx);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganization(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.organizationsService.getOrganization(ctx, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization name' })
  @ApiResponse({ status: 200, description: 'Organization name updated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.organizationsService.updateOrganization(ctx, id, dto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get organization statistics and usage' })
  @ApiResponse({ status: 200, description: 'Organization statistics' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationStats(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.organizationsService.getOrganizationStats(ctx, id);
  }
}
