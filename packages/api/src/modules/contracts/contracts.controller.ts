import { PERMISSIONS } from '@gymspace/shared';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { ContractsService } from './contracts.service';
import { CancelContractDto, CreateContractDto, FreezeContractDto, GetContractsDto, RenewContractDto } from './dto';

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
  @ApiResponse({ status: 200, description: 'List of contracts' })
  async getGymContracts(
    @AppCtxt() ctx: RequestContext,
    @Query() query: GetContractsDto,
  ) {
    return await this.contractsService.getGymContracts(ctx, query);
  }

  @Get('client/:clientId')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({ summary: 'Get client contract history' })
  @ApiResponse({ status: 200, description: 'List of client contracts' })
  async getClientContracts(@AppCtxt() ctx: RequestContext, @Param('clientId') clientId: string) {
    return await this.contractsService.getClientContracts(ctx, clientId);
  }

  @Post('update-expired')
  @Allow(PERMISSIONS.CONTRACTS_UPDATE)
  @ApiOperation({
    summary: 'Update expired contracts status (deprecated - use update-status instead)',
  })
  @ApiResponse({ status: 200, description: 'Number of contracts updated' })
  async updateExpiredContracts(@AppCtxt() ctx: RequestContext) {
    // Trigger both expiring_soon and expired updates for backward compatibility
    const result = await this.contractsService.triggerContractStatusUpdate();
    return {
      message: `Se actualizaron ${result.expiringSoonCount + result.expiredCount} contratos`,
      expiringSoonCount: result.expiringSoonCount,
      expiredCount: result.expiredCount,
      executionTime: result.executionTime,
    };
  }

  @Post('update-status')
  @Allow(PERMISSIONS.CONTRACTS_UPDATE)
  @ApiOperation({
    summary: 'Trigger intelligent contract status updates',
    description:
      'Manually trigger the intelligent contract status update process that runs on cron',
  })
  @ApiResponse({
    status: 200,
    description: 'Contract status updates completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        expiringSoonCount: { type: 'number' },
        expiredCount: { type: 'number' },
        executionTime: { type: 'number' },
      },
    },
  })
  async triggerContractStatusUpdate(@AppCtxt() ctx: RequestContext) {
    const result = await this.contractsService.triggerContractStatusUpdate();
    return {
      message: `Actualización inteligente de contratos completada. ${result.expiringSoonCount} marcados como 'expirando pronto', ${result.expiredCount} marcados como 'expirados'`,
      expiringSoonCount: result.expiringSoonCount,
      expiredCount: result.expiredCount,
      executionTime: result.executionTime,
    };
  }

  @Get('status-stats')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({
    summary: 'Get contract status statistics',
    description: 'Returns statistics about contract statuses and contracts needing updates',
  })
  @ApiResponse({ status: 200, description: 'Contract status statistics' })
  async getContractStatusStats(@AppCtxt() ctx: RequestContext) {
    return await this.contractsService.getContractStatusStats();
  }

  @Get('status-check')
  @Allow(PERMISSIONS.CONTRACTS_READ)
  @ApiOperation({
    summary: 'Check contracts needing status updates',
    description: 'Returns contracts that need status updates for monitoring purposes',
  })
  @ApiResponse({ status: 200, description: 'Contracts needing status updates' })
  async getContractsNeedingStatusUpdate(@AppCtxt() ctx: RequestContext) {
    const gymId = ctx.getGymId();
    return await this.contractsService.getContractsNeedingStatusUpdate(gymId);
  }
}
