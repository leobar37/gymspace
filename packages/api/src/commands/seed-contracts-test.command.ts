import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';
import { ContractStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Command to seed test contracts for lifecycle management testing
 *
 * Usage: pnpm run cli seed:contracts:test
 *
 * This command creates various test scenarios:
 * 1. Active contracts that should become expiring_soon (within 7 days)
 * 2. Contracts that should expire (past end date)
 * 3. Expired contracts with pending renewals (with payment)
 * 4. Expired contracts with pending renewals (without payment)
 * 5. Frozen contracts that should be reactivated
 * 6. Frozen contracts that should remain frozen
 *
 * After running this command, run the cron job manually to test all scenarios
 */
@Injectable()
@Command({
  name: 'seed:contracts:test',
  description: 'Seed test contracts for lifecycle management testing',
})
export class SeedContractsTestCommand extends CommandRunner {
  private readonly logger = new Logger(SeedContractsTestCommand.name);

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Starting test contracts seeding...');

    try {
      // Get first gym and client for testing
      const gym = await this.prismaService.gym.findFirst({
        where: { deletedAt: null },
      });

      if (!gym) {
        this.logger.error('No gym found. Please create a gym first.');
        return;
      }

      const gymClient = await this.prismaService.gymClient.findFirst({
        where: {
          gymId: gym.id,
          deletedAt: null,
        },
      });

      if (!gymClient) {
        this.logger.error('No client found. Please create a client first.');
        return;
      }

      const membershipPlan = await this.prismaService.gymMembershipPlan.findFirst({
        where: {
          gymId: gym.id,
          deletedAt: null,
        },
      });

      if (!membershipPlan) {
        this.logger.error('No membership plan found. Please create a plan first.');
        return;
      }

      const paymentMethod = await this.prismaService.paymentMethod.findFirst({
        where: {
          deletedAt: null,
        },
      });

      if (!paymentMethod) {
        this.logger.error('No payment method found. Please create a payment method first.');
        return;
      }

      const user = await this.prismaService.user.findFirst();
      if (!user) {
        this.logger.error('No user found. Please create a user first.');
        return;
      }

      const now = new Date();

      // Clean up existing test contracts
      this.logger.log('Cleaning up existing test contracts...');
      await this.prismaService.contract.deleteMany({
        where: {
          gymClientId: gymClient.id,
          notes: {
            startsWith: 'TEST-CONTRACT',
          },
        },
      });

      const contracts: Prisma.ContractCreateManyInput[] = [];

      // 1. Active contract that should become expiring_soon (5 days from now)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.active,
        startDate: dayjs(now).subtract(25, 'days').toDate(),
        endDate: dayjs(now).add(5, 'days').toDate(), // Will be expiring_soon
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Should become expiring_soon',
        createdByUserId: user.id,
      });

      // 2. Active contract that should expire (2 days ago)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.active,
        startDate: dayjs(now).subtract(32, 'days').toDate(),
        endDate: dayjs(now).subtract(2, 'days').toDate(), // Should expire
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Should expire (active to expired)',
        createdByUserId: user.id,
      });

      // 3. Expiring_soon contract that should expire (1 day ago)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.expiring_soon,
        startDate: dayjs(now).subtract(31, 'days').toDate(),
        endDate: dayjs(now).subtract(1, 'day').toDate(), // Should expire
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Should expire (expiring_soon to expired)',
        createdByUserId: user.id,
      });

      // 4. Expired contract with paid renewal (should activate renewal)
      const expiredWithRenewalId = 'test-expired-with-renewal';
      contracts.push({
        id: expiredWithRenewalId,
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.expired,
        startDate: dayjs(now).subtract(60, 'days').toDate(),
        endDate: dayjs(now).subtract(30, 'days').toDate(),
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Expired with paid renewal',
        createdByUserId: user.id,
      });

      // 5. Renewal for expired contract (with payment)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.pending,
        parentId: expiredWithRenewalId, // Link to parent contract
        startDate: dayjs(now).toDate(),
        endDate: dayjs(now).add(30, 'days').toDate(),
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100), // Has payment
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Renewal (paid) - should activate',
        createdByUserId: user.id,
      });

      // 6. Expired contract with unpaid renewal (should NOT activate)
      const expiredWithUnpaidRenewalId = 'test-expired-unpaid-renewal';
      contracts.push({
        id: expiredWithUnpaidRenewalId,
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.expired,
        startDate: dayjs(now).subtract(60, 'days').toDate(),
        endDate: dayjs(now).subtract(25, 'days').toDate(),
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Expired with unpaid renewal',
        createdByUserId: user.id,
      });

      // 7. Renewal for expired contract (without payment)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.pending,
        parentId: expiredWithUnpaidRenewalId,
        startDate: dayjs(now).toDate(),
        endDate: dayjs(now).add(30, 'days').toDate(),
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(0), // No payment
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Renewal (unpaid) - should NOT activate',
        createdByUserId: user.id,
      });

      // 8. Frozen contract that should be reactivated (freeze ended yesterday)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.frozen,
        startDate: dayjs(now).subtract(45, 'days').toDate(),
        endDate: dayjs(now).add(15, 'days').toDate(),
        freezeStartDate: dayjs(now).subtract(10, 'days').toDate(),
        freezeEndDate: dayjs(now).subtract(1, 'day').toDate(), // Should reactivate
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Frozen - should reactivate',
        createdByUserId: user.id,
      });

      // 9. Frozen contract that should remain frozen (freeze ends in 5 days)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.frozen,
        startDate: dayjs(now).subtract(40, 'days').toDate(),
        endDate: dayjs(now).add(20, 'days').toDate(),
        freezeStartDate: dayjs(now).subtract(5, 'days').toDate(),
        freezeEndDate: dayjs(now).add(5, 'days').toDate(), // Should stay frozen
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Frozen - should stay frozen',
        createdByUserId: user.id,
      });

      // 10. Active contract that should stay active (expires in 15 days)
      contracts.push({
        gymClientId: gymClient.id,
        gymMembershipPlanId: membershipPlan.id,
        paymentMethodId: paymentMethod.id,
        status: ContractStatus.active,
        startDate: dayjs(now).subtract(15, 'days').toDate(),
        endDate: dayjs(now).add(15, 'days').toDate(), // Should stay active
        basePrice: new Prisma.Decimal(100),
        finalAmount: new Prisma.Decimal(100),
        currency: 'PEN',
        paymentFrequency: 'monthly',
        notes: 'TEST-CONTRACT: Should stay active',
        createdByUserId: user.id,
      });

      // Create all contracts
      const result = await this.prismaService.contract.createMany({
        data: contracts,
      });

      this.logger.log(`Created ${result.count} test contracts`);

      // Expected JSON output after running the cron job
      const expectedOutput = {
        success: true,
        timestamp: new Date().toISOString(),
        expiringSoon: {
          processed: true,
          count: 1, // 1 contract will become expiring_soon
        },
        expired: {
          processed: true,
          expiredCount: 2, // 2 contracts will expire
          renewalsActivated: 1, // 1 renewal will activate (paid)
          errors: [],
        },
        frozen: {
          processed: true,
          reactivatedCount: 1, // 1 frozen contract will reactivate
          stillFrozenCount: 1, // 1 frozen contract will stay frozen
          errors: [],
        },
        finalStats: {
          active: 3, // 1 stays active + 1 reactivated from frozen + 1 activated renewal
          expiringSoon: 1, // 1 newly marked as expiring_soon
          expired: 4, // 2 newly expired + 2 already expired
          frozen: 1, // 1 stays frozen
          total: 10, // Total contracts including 2 pending renewals
          needsUpdate: {
            expiringSoon: 0, // No more contracts need to be marked as expiring_soon
            expired: 0, // No more contracts need to be marked as expired
            total: 0,
          },
        },
      };

      this.logger.log('\n✅ Test contracts created successfully!');
      this.logger.log('\n📋 Expected output after running cron job:');
      this.logger.log(JSON.stringify(expectedOutput, null, 2));
      this.logger.log('\n🚀 Now run the cron job manually to test the lifecycle management');
    } catch (error) {
      this.logger.error('Failed to seed test contracts', error);
      throw error;
    }
  }
}
