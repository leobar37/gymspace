import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, RenewContractDto, FreezeContractDto } from './dto';
import { Allow, RequestContext } from '../../common/decorators';
import { RequestContextService } from '../../common/services/request-context.service';
import { PERMISSIONS, ContractStatus } from '@gymspace/shared';

@ApiTags('Contracts')
@Controller('contracts')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Allow(PERMISSIONS.CONTRACTS_CREATE)
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createContract(
    @Body() dto: CreateContractDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.contractsService.createContract(ctx.getGymId()!, dto, ctx.getUserId());
  }

  @Post(':id/renew')
  @Allow(PERMISSIONS.CONTRACTS_UPDATE)
  @ApiOperation({ summary: 'Renew an existing contract' })
  @ApiResponse({ status: 200, description: 'Contract renewed successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async renewContract(
    @Param('id') id: string,
    @Body() dto: RenewContractDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.contractsService.renewContract(id, dto, ctx.getUserId());
  }

  @Post(':id/freeze')
  @Allow(PERMISSIONS.CONTRACTS_UPDATE)
  @ApiOperation({ summary: 'Freeze a contract' })
  @ApiResponse({ status: 200, description: 'Contract frozen successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async freezeContract(
    @Param('id') id: string,
    @Body() dto: FreezeContractDto,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.contractsService.freezeContract(id, dto, ctx.getUserId());
  }

  @Put(':id/cancel')
  @Allow(PERMISSIONS.CONTRACTS_CANCEL)
  @ApiOperation({ summary: 'Cancel a contract' })
  @ApiResponse({ status: 200, description: 'Contract cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async cancelContract(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.contractsService.cancelContract(id, reason, ctx.getUserId());
  }

  @Get(':id')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get contract details' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContract(@Param('id') id: string, @RequestContext() ctx: RequestContextService) {
    return await this.contractsService.getContract(id, ctx.getUserId());
  }

  @Get()
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get contracts for gym' })
  @ApiQuery({ name: 'status', enum: ContractStatus, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'List of contracts' })
  async getGymContracts(
    @Query('status') status: ContractStatus,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.contractsService.getGymContracts(
      ctx.getGymId()!,
      ctx.getUserId(),
      status,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get('client/:clientId')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get client contract history' })
  @ApiResponse({ status: 200, description: 'List of client contracts' })
  async getClientContracts(
    @Param('clientId') clientId: string,
    @RequestContext() ctx: RequestContextService,
  ) {
    return await this.contractsService.getClientContracts(clientId, ctx.getUserId());
  }
}
