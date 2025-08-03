import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RequestContext } from '../../common/decorators';
import { RequestContextService } from '../../common/services/request-context.service';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganization(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.organizationsService.getOrganization(id, ctx.getUserId());
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.organizationsService.updateOrganization(id, dto, ctx.getUserId());
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get organization statistics and usage' })
  @ApiResponse({ status: 200, description: 'Organization statistics' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationStats(
    @Param('id') id: string,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.organizationsService.getOrganizationStats(id, ctx.getUserId());
  }
}
