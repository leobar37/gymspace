import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
// Commands
import { SetupDefaultUserCommand } from './setup-default-user.command';
import { TestCommand } from './test.command';

// Core modules
import { AuthModule } from '../core/auth/auth.module';
import { CacheModule } from '../core/cache/cache.module';
import { CommonModule } from '../common/common.module';

// Business modules
import { HealthModule } from '../modules/health/health.module';
import { AuthModule as AuthBusinessModule } from '../modules/auth/auth.module';
import { InvitationsModule } from '../modules/invitations/invitations.module';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { GymsModule } from '../modules/gyms/gyms.module';
import { ClientsModule } from '../modules/clients/clients.module';
import { MembershipPlansModule } from '../modules/membership-plans/membership-plans.module';
import { ContractsModule } from '../modules/contracts/contracts.module';
import { EvaluationsModule } from '../modules/evaluations/evaluations.module';
import { CheckInsModule } from '../modules/check-ins/check-ins.module';
import { PublicCatalogModule } from '../modules/public-catalog/public-catalog.module';
import { LeadsModule } from '../modules/leads/leads.module';
import { AssetsModule } from '../modules/assets/assets.module';
import { OnboardingModule } from '../modules/onboarding/onboarding.module';
import { SubscriptionsModule } from '../modules/subscriptions/subscriptions.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { ProductsModule } from '../modules/products/products.module';

// Configuration
import configuration from '../config/configuration';
import validationSchema from '../config/validation.schema';

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
    AuthModule,
    CacheModule,
    CommonModule,
    ScheduleModule.forRoot(),

    // Business modules
    HealthModule,
    AuthBusinessModule,
    InvitationsModule,
    OrganizationsModule,
    GymsModule,
    ClientsModule,
    MembershipPlansModule,
    ContractsModule,
    EvaluationsModule,
    CheckInsModule,
    PublicCatalogModule,
    LeadsModule,
    AssetsModule,
    OnboardingModule,
    SubscriptionsModule,
    DashboardModule,
    ProductsModule,
  ],
  providers: [SetupDefaultUserCommand, TestCommand],
})
export class CommandsModule {}
