import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, SearchClientsDto } from './dto';
import { Allow, RequestContext } from '../../common/decorators';
import { RequestContextService } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Clients')
@Controller('clients')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Allow(PERMISSIONS.CLIENTS_CREATE)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client limit reached' })
  async createClient(@Body() dto: CreateClientDto, @RequestContext() ctx: RequestContextService) {
    return await this.clientsService.createClient(ctx.getGymId()!, dto, ctx.getUserId()!);
  }

  @Get(':id')
  @Allow(PERMISSIONS.CLIENTS_READ)
  @ApiOperation({ summary: 'Get client details' })
  @ApiResponse({ status: 200, description: 'Client details' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.clientsService.getClient(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.CLIENTS_UPDATE)
  @ApiOperation({ summary: 'Update client information' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.clientsService.updateClient(id, dto, ctx.getUserId());
  }

  @Get()
  @Allow(PERMISSIONS.CLIENTS_READ)
  @ApiOperation({ summary: 'Search clients in gym' })
  @ApiResponse({ status: 200, description: 'List of clients' })
  async searchClients(
    @Query() dto: SearchClientsDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.clientsService.searchClients(ctx.getGymId()!, dto, ctx.getUserId()!);
  }

  @Put(':id/toggle-status')
  @Allow(PERMISSIONS.CLIENTS_UPDATE)
  @ApiOperation({ summary: 'Toggle client active/inactive status' })
  @ApiResponse({ status: 200, description: 'Client status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async toggleClientStatus(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.clientsService.toggleClientStatus(id, ctx.getUserId());
  }

  @Get(':id/stats')
  @Allow(PERMISSIONS.CLIENTS_READ)
  @ApiOperation({ summary: 'Get client statistics' })
  @ApiResponse({ status: 200, description: 'Client statistics' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientStats(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.clientsService.getClientStats(id, ctx.getUserId());
  }
}
