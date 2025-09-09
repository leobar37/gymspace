import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { GymsService } from '../gyms/gyms.service';
import { ClientsService } from '../clients/clients.service';
import { CreateEvaluationDto, UpdateEvaluationDto } from './dto';
import { ResourceNotFoundException } from '../../common/exceptions';
import { Evaluation } from '@prisma/client';
import { RequestContext } from '../../common/services/request-context.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private prismaService: PrismaService,
    private gymsService: GymsService,
    private clientsService: ClientsService,
  ) {}

  /**
   * Create a new evaluation (CU-015)
   */
  async createEvaluation(
    context: RequestContext,
    dto: CreateEvaluationDto,
  ): Promise<Evaluation> {
    const gymId = context.getGymId()!;
    const userId = context.getUserId()!;
    
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(context, gymId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    // Verify client belongs to this gym
    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: dto.gymClientId,
        gymId,
      },
    });

    if (!client) {
      throw new ResourceNotFoundException('Client', dto.gymClientId);
    }

    // Calculate BMI
    const heightInMeters = dto.height / 100;
    const bmi = dto.weight / (heightInMeters * heightInMeters);

    // Get previous evaluation for comparison
    const previousEvaluation = await this.prismaService.evaluation.findFirst({
      where: {
        gymClientId: dto.gymClientId,
        gymId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress if there's a previous evaluation
    let progress = {};
    if (previousEvaluation) {
      progress = {
        weightChange: dto.weight - (previousEvaluation.initialData as any)?.weight || 0,
        bmiChange: bmi - (previousEvaluation.initialData as any)?.bmi || 0,
        bodyFatChange:
          dto.bodyFatPercentage && (previousEvaluation.initialData as any)?.bodyFatPercentage
            ? dto.bodyFatPercentage - (previousEvaluation.initialData as any).bodyFatPercentage
            : null,
        muscleMassChange:
          dto.muscleMassPercentage && (previousEvaluation.initialData as any)?.muscleMassPercentage
            ? dto.muscleMassPercentage -
              (previousEvaluation.initialData as any).muscleMassPercentage
            : null,
      };
    }

    // Create evaluation
    const plannedEndDate = new Date();
    plannedEndDate.setDate(plannedEndDate.getDate() + 30); // Default 30 days duration

    const evaluation = await this.prismaService.evaluation.create({
      data: {
        gymClientId: dto.gymClientId,
        gymId,
        evaluationType: 'initial',
        status: 'open',
        durationDays: 30,
        plannedEndDate,
        initialData: {
          weight: dto.weight,
          height: dto.height,
          bmi,
          bodyFatPercentage: dto.bodyFatPercentage,
          muscleMassPercentage: dto.muscleMassPercentage,
          measurements: dto.measurements || {},
          healthMetrics: dto.healthMetrics || {},
          performanceMetrics: dto.performanceMetrics || {},
          notes: dto.notes,
          recommendations: dto.recommendations,
          progress,
        },
        goals: dto.goals,
        createdByUserId: userId,
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return evaluation;
  }

  /**
   * Update evaluation (CU-016)
   */
  async updateEvaluation(
    evaluationId: string,
    dto: UpdateEvaluationDto,
    userId: string,
  ): Promise<Evaluation> {
    // Verify evaluation exists and user has access
    const evaluation = await this.prismaService.evaluation.findFirst({
      where: {
        id: evaluationId,
        Gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
    });

    if (!evaluation) {
      throw new ResourceNotFoundException('Evaluation', evaluationId);
    }

    // Recalculate BMI if weight or height changed
    const currentData = evaluation.initialData as any;
    let bmi = currentData?.bmi;
    if (dto.weight || dto.height) {
      const weight = dto.weight || currentData?.weight;
      const height = dto.height || currentData?.height;
      const heightInMeters = height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    // Update evaluation
    const updatedInitialData = {
      ...currentData,
      weight: dto.weight || currentData?.weight,
      height: dto.height || currentData?.height,
      bmi,
      bodyFatPercentage:
        dto.bodyFatPercentage !== undefined
          ? dto.bodyFatPercentage
          : currentData?.bodyFatPercentage,
      muscleMassPercentage:
        dto.muscleMassPercentage !== undefined
          ? dto.muscleMassPercentage
          : currentData?.muscleMassPercentage,
      measurements: dto.measurements || currentData?.measurements,
      healthMetrics: dto.healthMetrics || currentData?.healthMetrics,
      performanceMetrics: dto.performanceMetrics || currentData?.performanceMetrics,
      notes: dto.notes !== undefined ? dto.notes : currentData?.notes,
      recommendations:
        dto.recommendations !== undefined ? dto.recommendations : currentData?.recommendations,
    };

    const updated = await this.prismaService.evaluation.update({
      where: { id: evaluationId },
      data: {
        initialData: updatedInitialData,
        goals: dto.goals,
        updatedByUserId: userId,
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluation(evaluationId: string, userId: string): Promise<Evaluation> {
    const evaluation = await this.prismaService.evaluation.findFirst({
      where: {
        id: evaluationId,
        Gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Gym: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!evaluation) {
      throw new ResourceNotFoundException('Evaluation', evaluationId);
    }

    return evaluation;
  }

  /**
   * Get client evaluation history (CU-017)
   */
  async getClientEvaluations(clientId: string, userId: string, limit = 12) {
    // Verify access through client
    // Create a RequestContext for the ClientsService call
    const requestContext = new RequestContext().forUser({ id: userId } as any);
    await this.clientsService.getClient(requestContext, clientId);

    const evaluations = await this.prismaService.evaluation.findMany({
      where: { gymClientId: clientId },
      include: {
        Gym: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate evolution metrics
    if (evaluations.length >= 2) {
      const latest = evaluations[0];
      const oldest = evaluations[evaluations.length - 1];

      const latestData = latest.initialData as any;
      const oldestData = oldest.initialData as any;

      const evolution = {
        weightChange:
          latestData?.weight && oldestData?.weight ? latestData.weight - oldestData.weight : null,
        bmiChange: latestData?.bmi && oldestData?.bmi ? latestData.bmi - oldestData.bmi : null,
        bodyFatChange:
          latestData?.bodyFatPercentage && oldestData?.bodyFatPercentage
            ? latestData.bodyFatPercentage - oldestData.bodyFatPercentage
            : null,
        muscleMassChange:
          latestData?.muscleMassPercentage && oldestData?.muscleMassPercentage
            ? latestData.muscleMassPercentage - oldestData.muscleMassPercentage
            : null,
        periodInDays: Math.floor(
          (latest.createdAt.getTime() - oldest.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      };

      return {
        evaluations,
        evolution,
        summary: {
          totalEvaluations: await this.prismaService.evaluation.count({
            where: { gymClientId: clientId },
          }),
          firstEvaluation: oldest.createdAt,
          lastEvaluation: latest.createdAt,
          currentWeight: (latest.initialData as any)?.weight || null,
          currentBMI: (latest.initialData as any)?.bmi || null,
        },
      };
    }

    return {
      evaluations,
      evolution: null,
      summary: {
        totalEvaluations: evaluations.length,
        firstEvaluation: evaluations[0]?.createdAt || null,
        lastEvaluation: evaluations[0]?.createdAt || null,
        currentWeight: (evaluations[0]?.initialData as any)?.weight || null,
        currentBMI: (evaluations[0]?.initialData as any)?.bmi || null,
      },
    };
  }

  /**
   * Get gym evaluation statistics
   */
  async getGymEvaluationStats(context: RequestContext) {
    const gymId = context.getGymId()!;
    const userId = context.getUserId()!;
    
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(context, gymId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalEvaluations, recentEvaluations, clientsEvaluated, averageMetrics] =
      await Promise.all([
        // Total evaluations
        this.prismaService.evaluation.count({
          where: { gymId },
        }),
        // Recent evaluations (last 30 days)
        this.prismaService.evaluation.count({
          where: {
            gymId,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        // Unique clients evaluated
        this.prismaService.evaluation.groupBy({
          by: ['gymClientId'],
          where: { gymId },
          _count: true,
        }),
        // Get all evaluations for manual average calculation
        this.prismaService.evaluation.findMany({
          where: { gymId },
          select: {
            initialData: true,
          },
        }),
      ]);

    // Calculate averages manually from JSON data
    const allData = averageMetrics.map((e) => e.initialData as any).filter((data) => data);
    const validWeights = allData.map((d) => d.weight).filter((w) => w != null);
    const validBmis = allData.map((d) => d.bmi).filter((b) => b != null);
    const validBodyFats = allData.map((d) => d.bodyFatPercentage).filter((bf) => bf != null);
    const validMuscleMass = allData.map((d) => d.muscleMassPercentage).filter((mm) => mm != null);

    const calculateAverage = (values: number[]) =>
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

    // Get recent evaluations with client info
    const recentEvaluationsList = await this.prismaService.evaluation.findMany({
      where: {
        gymId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      summary: {
        totalEvaluations,
        recentEvaluations,
        clientsEvaluated: clientsEvaluated.length,
        evaluationRate: (recentEvaluations / 30).toFixed(2),
      },
      averages: {
        weight: calculateAverage(validWeights)?.toFixed(2) || null,
        bmi: calculateAverage(validBmis)?.toFixed(2) || null,
        bodyFatPercentage: calculateAverage(validBodyFats)?.toFixed(2) || null,
        muscleMassPercentage: calculateAverage(validMuscleMass)?.toFixed(2) || null,
      },
      recentEvaluations: recentEvaluationsList,
    };
  }

  /**
   * Generate evaluation PDF report
   */
  async generateEvaluationReport(evaluationId: string, userId: string) {
    const evaluation = await this.getEvaluation(evaluationId, userId);

    // Get client's previous evaluations for comparison
    const previousEvaluations = await this.prismaService.evaluation.findMany({
      where: {
        gymClientId: evaluation.gymClientId,
        createdAt: { lt: evaluation.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // TODO: Implement PDF generation
    // For now, return the data structure that would be used for PDF
    return {
      evaluation,
      previousEvaluations,
      reportGeneratedAt: new Date(),
      reportGeneratedBy: userId,
    };
  }

  /**
   * Delete evaluation
   */
  async deleteEvaluation(evaluationId: string, userId: string): Promise<void> {
    const evaluation = await this.prismaService.evaluation.findFirst({
      where: {
        id: evaluationId,
        Gym: {
          organization: { ownerUserId: userId },
        },
      },
    });

    if (!evaluation) {
      throw new ResourceNotFoundException('Evaluation', evaluationId);
    }

    await this.prismaService.evaluation.delete({
      where: { id: evaluationId },
    });
  }
}
