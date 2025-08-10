import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

// Define soft delete models as a const array for type safety
const SOFT_DELETE_MODELS = [
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
] as const;

// Create a function to generate the extended Prisma client
function createExtendedPrismaClient(configService: ConfigService) {
  const prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: configService.get<string>('database.url'),
      },
    },
    log: configService.get<string>('nodeEnv') === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });

  return {
    base: prismaClient,
    extended: prismaClient.$extends({
      name: 'softDeleteAndAudit',
      query: {
        // Apply soft delete logic to all models
        $allModels: {
          // Override findUnique to exclude soft deleted records
          async findUnique({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },

          // Override findFirst to exclude soft deleted records
          async findFirst({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },

          // Override findMany to exclude soft deleted records
          async findMany({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              if (args.where) {
                if (args.where.deletedAt === undefined) {
                  args.where = { ...args.where, deletedAt: null };
                }
              } else {
                args.where = { deletedAt: null };
              }
            }
            return query(args);
          },

          // Override update to exclude soft deleted records
          async update({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              args.where = { ...args.where, deletedAt: null };
            }
            // Add updatedAt timestamp
            args.data = { ...args.data, updatedAt: new Date() };
            return query(args);
          },

          // Override updateMany to exclude soft deleted records
          async updateMany({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              if (args.where) {
                args.where = { ...args.where, deletedAt: null };
              } else {
                args.where = { deletedAt: null };
              }
            }
            // Add updatedAt timestamp
            args.data = { ...args.data, updatedAt: new Date() };
            return query(args);
          },

          // Override delete to perform soft delete
          async delete({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              // Instead of using delete, we'll use update to soft delete
              const modelDelegate = (prismaClient as any)[model.charAt(0).toLowerCase() + model.slice(1)];
              return modelDelegate.update({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },

          // Override deleteMany to perform soft delete
          async deleteMany({ model, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model as any)) {
              // Instead of using deleteMany, we'll use updateMany to soft delete
              const modelDelegate = (prismaClient as any)[model.charAt(0).toLowerCase() + model.slice(1)];
              return modelDelegate.updateMany({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },

          // Override create to add timestamps
          async create({ args, query }) {
            const now = new Date();
            args.data = {
              ...args.data,
              createdAt: args.data.createdAt || now,
              updatedAt: args.data.updatedAt || now,
            };
            return query(args);
          },

          // Override createMany to add timestamps
          async createMany({ args, query }) {
            const now = new Date();
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                createdAt: item.createdAt || now,
                updatedAt: item.updatedAt || now,
              }));
            } else {
              args.data = {
                ...args.data,
                createdAt: args.data.createdAt || now,
                updatedAt: args.data.updatedAt || now,
              };
            }
            return query(args);
          },
        },
      },
    }),
  };
}

type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>['extended'];
type BasePrismaClient = ReturnType<typeof createExtendedPrismaClient>['base'];

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private baseClient: BasePrismaClient;
  private extendedClient: ExtendedPrismaClient;

  // Delegate all Prisma model properties
  public readonly user: ExtendedPrismaClient['user'];
  public readonly organization: ExtendedPrismaClient['organization'];
  public readonly gym: ExtendedPrismaClient['gym'];
  public readonly role: ExtendedPrismaClient['role'];
  public readonly collaborator: ExtendedPrismaClient['collaborator'];
  public readonly invitation: ExtendedPrismaClient['invitation'];
  public readonly gymClient: ExtendedPrismaClient['gymClient'];
  public readonly gymMembershipPlan: ExtendedPrismaClient['gymMembershipPlan'];
  public readonly contract: ExtendedPrismaClient['contract'];
  public readonly asset: ExtendedPrismaClient['asset'];
  public readonly checkIn: ExtendedPrismaClient['checkIn'];
  public readonly evaluation: ExtendedPrismaClient['evaluation'];
  public readonly evaluationComment: ExtendedPrismaClient['evaluationComment'];
  public readonly subscriptionPlan: ExtendedPrismaClient['subscriptionPlan'];
  public readonly lead: ExtendedPrismaClient['lead'];
  public readonly product: ExtendedPrismaClient['product'];
  public readonly productCategory: ExtendedPrismaClient['productCategory'];
  public readonly supplier: ExtendedPrismaClient['supplier'];
  public readonly sale: ExtendedPrismaClient['sale'];
  public readonly saleItem: ExtendedPrismaClient['saleItem'];

  // Expose transaction methods
  public readonly $transaction: ExtendedPrismaClient['$transaction'];
  public readonly $connect: ExtendedPrismaClient['$connect'];
  public readonly $disconnect: ExtendedPrismaClient['$disconnect'];
  public readonly $queryRaw: ExtendedPrismaClient['$queryRaw'];
  public readonly $executeRaw: ExtendedPrismaClient['$executeRaw'];

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    // Create the base and extended clients
    const clients = createExtendedPrismaClient(configService);
    this.baseClient = clients.base;
    this.extendedClient = clients.extended;

    // Bind all model properties
    this.user = this.extendedClient.user;
    this.organization = this.extendedClient.organization;
    this.gym = this.extendedClient.gym;
    this.role = this.extendedClient.role;
    this.collaborator = this.extendedClient.collaborator;
    this.invitation = this.extendedClient.invitation;
    this.gymClient = this.extendedClient.gymClient;
    this.gymMembershipPlan = this.extendedClient.gymMembershipPlan;
    this.contract = this.extendedClient.contract;
    this.asset = this.extendedClient.asset;
    this.checkIn = this.extendedClient.checkIn;
    this.evaluation = this.extendedClient.evaluation;
    this.evaluationComment = this.extendedClient.evaluationComment;
    this.subscriptionPlan = this.extendedClient.subscriptionPlan;
    this.lead = this.extendedClient.lead;
    this.product = this.extendedClient.product;
    this.productCategory = this.extendedClient.productCategory;
    this.supplier = this.extendedClient.supplier;
    this.sale = this.extendedClient.sale;
    this.saleItem = this.extendedClient.saleItem;

    // Bind Prisma methods
    this.$transaction = this.extendedClient.$transaction.bind(this.extendedClient);
    this.$connect = this.extendedClient.$connect.bind(this.extendedClient);
    this.$disconnect = this.extendedClient.$disconnect.bind(this.extendedClient);
    this.$queryRaw = this.extendedClient.$queryRaw.bind(this.extendedClient);
    this.$executeRaw = this.extendedClient.$executeRaw.bind(this.extendedClient);

    // Set up logging events on the base client
    if (configService.get<string>('nodeEnv') === 'development') {
      this.baseClient.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
      });
    }

    this.baseClient.$on('error' as never, (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`, e.target);
    });

    this.baseClient.$on('warn' as never, (e: any) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      // Connect to the database
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to database');

      // Set up graceful shutdown handlers
      this.setupShutdownHandlers();
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async disconnect() {
    if (this.isConnected) {
      try {
        await this.$disconnect();
        this.isConnected = false;
        this.logger.log('Successfully disconnected from database');
      } catch (error) {
        this.logger.error('Error disconnecting from database', error);
      }
    }
  }

  private setupShutdownHandlers() {
    // Handle graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      this.logger.log('Received SIGINT, closing database connection...');
      await this.disconnect();
      process.exit(0);
    });

    // Handle graceful shutdown on SIGTERM
    process.on('SIGTERM', async () => {
      this.logger.log('Received SIGTERM, closing database connection...');
      await this.disconnect();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught exception, closing database connection...', error);
      await this.disconnect();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('Unhandled promise rejection, closing database connection...', { reason, promise });
      await this.disconnect();
      process.exit(1);
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