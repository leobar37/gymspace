import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('database.url'),
        },
      },
      log:
        configService.get<string>('nodeEnv') === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    // Apply soft delete middleware
    this.applySoftDeleteMiddleware();

    // Apply audit fields middleware
    this.applyAuditFieldsMiddleware();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private applySoftDeleteMiddleware() {
    // Intercept all find queries to exclude soft deleted records
    this.$use(async (params, next) => {
      // Check for soft delete models
      const softDeleteModels = [
        'User',
        'Organization',
        'Gym',
        'Role',
        'Collaborator',
        'Invitation',
        'GymClient',
        'GymMembershipPlan',
        'Contract',
        'Asset',
        'CheckIn',
        'Evaluation',
        'EvaluationComment',
        'ContractAsset',
        'ClientAsset',
        'EvaluationAsset',
        'CommentAsset',
      ];

      if (softDeleteModels.includes(params.model as string)) {
        // Find queries
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.args.where = { ...params.args.where, deletedAt: null };
        }

        if (params.action === 'findMany') {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where = { ...params.args.where, deletedAt: null };
            }
          } else {
            params.args.where = { deletedAt: null };
          }
        }

        // Update queries should not affect soft deleted records
        if (params.action === 'update') {
          params.args.where = { ...params.args.where, deletedAt: null };
        }

        if (params.action === 'updateMany') {
          if (params.args.where) {
            params.args.where = { ...params.args.where, deletedAt: null };
          } else {
            params.args.where = { deletedAt: null };
          }
        }

        // Delete queries should be soft deletes
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { deletedAt: new Date() };
        }
      }

      return next(params);
    });
  }

  private applyAuditFieldsMiddleware() {
    // This will be populated from RequestContext
    this.$use(async (params, next) => {
      const now = new Date();

      // Auto-set timestamps
      if (params.action === 'create') {
        params.args.data.createdAt = now;
        params.args.data.updatedAt = now;
      }

      if (params.action === 'createMany') {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          createdAt: now,
          updatedAt: now,
        }));
      }

      if (params.action === 'update') {
        params.args.data.updatedAt = now;
      }

      if (params.action === 'updateMany') {
        params.args.data.updatedAt = now;
      }

      return next(params);
    });
  }

  // Helper method to include audit fields in create operations
  withAuditFields<T extends Record<string, any>>(
    data: T,
    userId: string,
  ): T & { createdByUserId: string; updatedByUserId: string } {
    return {
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    };
  }

  // Helper method to include audit fields in update operations
  withUpdateAuditFields<T extends Record<string, any>>(
    data: T,
    userId: string,
  ): T & { updatedByUserId: string } {
    return {
      ...data,
      updatedByUserId: userId,
    };
  }
}
