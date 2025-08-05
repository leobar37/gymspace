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
import { CreateContractDto, RenewContractDto, FreezeContractDto, CancelContractDto } from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
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
  async createContract(@AppCtxt() ctx: RequestContext, @Body() dto: CreateContractDto) {
    return await this.contractsService.createContract(ctx, dto);
  }

  @Post(':id/renew')
  @Allow(PERMISSIONS.CONTRACTS_UPDATE)
  @ApiOperation({ summary: 'Renew an existing contract' })
  @ApiResponse({ status: 200, description: 'Contract renewed successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async renewContract(
    @AppCtxt() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: RenewContractDto,
  ) {
    return await this.contractsService.renewContract(ctx, id, dto);
  }

  @Post(':id/freeze')
  @Allow(PERMISSIONS.CONTRACTS_UPDATE)
  @ApiOperation({ summary: 'Freeze a contract' })
  @ApiResponse({ status: 200, description: 'Contract frozen successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async freezeContract(
    @AppCtxt() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: FreezeContractDto,
  ) {
    return await this.contractsService.freezeContract(ctx, id, dto);
  }

  @Put(':id/cancel')
  @Allow(PERMISSIONS.CONTRACTS_CANCEL)
  @ApiOperation({ summary: 'Cancel a contract' })
  @ApiResponse({ status: 200, description: 'Contract cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async cancelContract(
    @AppCtxt() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: CancelContractDto,
  ) {
    return await this.contractsService.cancelContract(ctx, id, dto.reason);
  }

  @Get(':id')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get contract details' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContract(@AppCtxt() ctx: RequestContext, @Param('id') id: string) {
    return await this.contractsService.getContract(ctx, id);
  }

  @Get()
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get contracts for gym' })
  @ApiQuery({ name: 'status', enum: ContractStatus, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'List of contracts' })
  async getGymContracts(
    @AppCtxt() ctx: RequestContext,
    @Query('status') status: ContractStatus,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    return await this.contractsService.getGymContracts(
      ctx,
      status,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get('client/:clientId')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get client contract history' })
  @ApiResponse({ status: 200, description: 'List of client contracts' })
  async getClientContracts(@AppCtxt() ctx: RequestContext, @Param('clientId') clientId: string) {
    return await this.contractsService.getClientContracts(ctx, clientId);
  }
}
