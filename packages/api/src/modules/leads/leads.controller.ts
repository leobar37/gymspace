import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, SearchLeadsDto } from './dto';
import { Allow, Public, RequestContext } from '../../common/decorators';
import { RequestContextService } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new lead from public catalog' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createLead(@Body() dto: CreateLeadDto) {
    return await this.leadsService.createLead(dto);
  }

  @Get(':id')
  @Allow(PERMISSIONS.LEADS_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead details' })
  @ApiResponse({ status: 200, description: 'Lead details' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async getLead(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.leadsService.getLead(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.LEADS_UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead status and information' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async updateLead(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.leadsService.updateLead(id, dto, ctx.getUserId());
  }

  @Get()
  @Allow(PERMISSIONS.LEADS_READ)
  @ApiBearerAuth()
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Search leads' })
  @ApiResponse({ status: 200, description: 'List of leads' })
  async searchLeads(@Query() dto: SearchLeadsDto, @RequestContext() ctx: RequestContextService) {
    return await this.leadsService.searchLeads(ctx.getGymId()!, dto, ctx.getUserId());
  }

  @Get('stats/gym')
  @Allow(PERMISSIONS.LEADS_READ)
  @ApiBearerAuth()
  @ApiSecurity('gym-id')
  @ApiOperation({ summary: 'Get lead statistics for gym' })
  @ApiResponse({ status: 200, description: 'Lead statistics' })
  async getLeadStats(@RequestContext() ctx: RequestContextService) {
    return await this.leadsService.getLeadStats(ctx.getGymId()!, ctx.getUserId());
  }

  @Post(':id/convert')
  @Allow(PERMISSIONS.LEADS_UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert lead to client' })
  @ApiResponse({ status: 200, description: 'Lead converted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiResponse({ status: 400, description: 'Lead already converted' })
  async convertLead(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.leadsService.convertLead(id, ctx.getUserId());
  }
}
