import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto, UpdateEvaluationDto } from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Evaluations')
@Controller('evaluations')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Allow(PERMISSIONS.EVALUATIONS_CREATE)
  @ApiOperation({ summary: 'Create a new evaluation for a client' })
  @ApiResponse({ status: 201, description: 'Evaluation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createEvaluation(@Body() dto: CreateEvaluationDto, @AppCtxt() ctx: RequestContext) {
    return await this.evaluationsService.createEvaluation(ctx.getGymId()!, dto, ctx.getUserId());
  }

  @Get(':id')
  @Allow(PERMISSIONS.EVALUATIONS_READ)
  @ApiOperation({ summary: 'Get evaluation details' })
  @ApiResponse({ status: 200, description: 'Evaluation details' })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  async getEvaluation(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.evaluationsService.getEvaluation(id, ctx.getUserId());
  }

  @Put(':id')
  @Allow(PERMISSIONS.EVALUATIONS_UPDATE)
  @ApiOperation({ summary: 'Update evaluation' })
  @ApiResponse({ status: 200, description: 'Evaluation updated successfully' })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  async updateEvaluation(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.evaluationsService.updateEvaluation(id, dto, ctx.getUserId());
  }

  @Get('client/:clientId')
  @Allow(PERMISSIONS.EVALUATIONS_READ)
  @ApiOperation({ summary: 'Get client evaluation history' })
  @ApiResponse({ status: 200, description: 'Client evaluation history with evolution metrics' })
  async getClientEvaluations(
    @Param('clientId') clientId: string,
    @Query('limit') limit: string,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.evaluationsService.getClientEvaluations(
      clientId,
      ctx.getUserId(),
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('gym/stats')
  @Allow(PERMISSIONS.EVALUATIONS_READ)
  @ApiOperation({ summary: 'Get gym evaluation statistics' })
  @ApiResponse({ status: 200, description: 'Gym evaluation statistics' })
  async getGymEvaluationStats(@AppCtxt() ctx: RequestContext) {
    return await this.evaluationsService.getGymEvaluationStats(ctx.getGymId()!, ctx.getUserId());
  }

  @Get(':id/report')
  @Allow(PERMISSIONS.EVALUATIONS_READ)
  @ApiOperation({ summary: 'Generate evaluation report' })
  @ApiResponse({ status: 200, description: 'Evaluation report data' })
  async generateEvaluationReport(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.evaluationsService.generateEvaluationReport(id, ctx.getUserId());
  }

  @Delete(':id')
  @Allow(PERMISSIONS.EVALUATIONS_DELETE)
  @ApiOperation({ summary: 'Delete evaluation' })
  @ApiResponse({ status: 200, description: 'Evaluation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  async deleteEvaluation(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    await this.evaluationsService.deleteEvaluation(id, ctx.getUserId());
    return { message: 'Evaluation deleted successfully' };
  }
}
