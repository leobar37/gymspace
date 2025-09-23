import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Core modules
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './core/auth/auth.module';
import { CacheModule } from './core/cache/cache.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from './core/logger/logger.module';
import { IngestModule } from './core/ingest/ingest.module';

// Business modules
import { HealthModule } from './modules/health/health.module';
import { AuthModule as AuthBusinessModule } from './modules/auth/auth.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { ClientsModule } from './modules/clients/clients.module';
import { MembershipPlansModule } from './modules/membership-plans/membership-plans.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { CheckInsModule } from './modules/check-ins/check-ins.module';
import { PublicCatalogModule } from './modules/public-catalog/public-catalog.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AssetsModule } from './modules/assets/assets.module';
import { FilesModule } from './modules/files/files.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { AdminSubscriptionManagementModule } from './modules/admin-subscription-management/admin-subscription-management.module';

// Global providers
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthGuard } from './core/auth/guards/auth.guard';
// Configuration
import configuration from './config/configuration';
import validationSchema from './config/validation.schema';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      cache: true,
    }),

    // Core modules
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CacheModule,
    CommonModule,
    IngestModule,
    ScheduleModule.forRoot(),

    // Business modules
    HealthModule,
    AuthBusinessModule,
    InvitationsModule,
    UsersModule,
    OrganizationsModule,
    GymsModule,
    // CollaboratorsModule,
    ClientsModule,
    MembershipPlansModule,
    ContractsModule,
    EvaluationsModule,
    CheckInsModule,
    PublicCatalogModule,
    LeadsModule,
    AssetsModule,
    FilesModule,
    OnboardingModule,
    SubscriptionsModule,
    DashboardModule,
    ProductsModule,
    SalesModule,
    SuppliersModule,
    PaymentMethodsModule,
    SubscriptionPlansModule,
    AdminSubscriptionManagementModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  static injector: ModuleRef;

  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    AppModule.injector = this.moduleRef;
  }
}
