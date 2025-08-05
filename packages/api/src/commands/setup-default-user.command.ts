import { UserType } from '@gymspace/shared';
import { Command, CommandRunner } from 'nest-commander';
import { AuthService } from '../core/auth/services/auth.service';
import { PrismaService } from '../core/database/prisma.service';
import { OnboardingService } from '../modules/onboarding/onboarding.service';

@Command({
  name: 'setup-user',
  description: 'Create a default admin user with complete onboarding',
})
export class SetupDefaultUserCommand extends CommandRunner {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting default user setup...\n');

    // Debug logging
    console.log('Services:', {
      onboarding: !!this.onboardingService,
      auth: !!this.authService,
      prisma: !!this.prismaService,
    });

    try {
      // Wait for Prisma to be ready
      if (!this.prismaService) {
        throw new Error('PrismaService is not injected properly');
      }
      await this.prismaService.$connect();
      console.log('✅ Connected to database');

      // Default user details
      const email = 'admin@gymspace.com';
      const password = 'Admin123!';
      const name = 'Default Admin';
      const phone = '+1234567890';
      const organizationName = 'Default Gym Organization';

      // Check if user already exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log('⚠️  User already exists with email:', email);
        console.log('🆔 Existing User ID:', existingUser.id);
        console.log('✅ Skipping user creation.\n');
        return;
      }

      console.log('📧 Creating user with email:', email);

      // Get default free subscription plan
      const defaultPlan = await this.prismaService.subscriptionPlan.findFirst({
        where: {
          price: {
            path: ['USD', 'value'],
            equals: 0,
          },
        },
      });

      if (!defaultPlan) {
        throw new Error('No free subscription plan found. Please run database seed first.');
      }

      console.log('📦 Using subscription plan:', defaultPlan.name);

      // Step 1: Start onboarding process (creates user, organization, and gym)
      console.log('\n🎯 Starting onboarding process...');
      const onboardingResult = await this.onboardingService.startOnboarding({
        email,
        password,
        name,
        phone,
        organizationName,
        country: 'US',
        currency: 'USD',
        timezone: 'America/New_York',
        subscriptionPlanId: defaultPlan.id,
      });

      console.log('✅ Onboarding started successfully');
      console.log('🏢 Organization:', onboardingResult.organization.name);
      console.log('🏋️  Gym:', onboardingResult.gym.name);
      console.log('👤 User:', onboardingResult.user.email);

      // Step 2: Verify email (simulate email verification)
      console.log('\n📧 Verifying email...');

      // Get the verification code from the database
      const userWithCode = await this.prismaService.user.findUnique({
        where: { id: onboardingResult.user.id },
        select: { verificationCode: true },
      });

      if (userWithCode?.verificationCode) {
        await this.authService.verifyEmail({
          email,
          code: userWithCode.verificationCode,
        });
        console.log('✅ Email verified successfully');
      } else {
        console.log('⚠️  No verification code found, skipping email verification');
      }

      // Step 3: Update gym settings (minimal setup for demo)
      console.log('\n⚙️  Configuring gym settings...');
      const context = {
        user: { id: onboardingResult.user.id, userType: UserType.OWNER },
        getUserId: () => onboardingResult.user.id,
        getUser: () => ({ id: onboardingResult.user.id, userType: UserType.OWNER }),
        getGymId: () => onboardingResult.gym.id,
        getCache: () => null,
        getPermissions: () => [],
      };

      await this.onboardingService.updateGymSettings(context as any, {
        gymId: onboardingResult.gym.id,
        name: 'Default Gym',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        phone: '+1234567890',
        email: 'gym@gymspace.com',
        capacity: 100,
        description: 'A modern fitness facility',
        businessHours: {
          monday: { open: '06:00', close: '22:00', closed: false },
          tuesday: { open: '06:00', close: '22:00', closed: false },
          wednesday: { open: '06:00', close: '22:00', closed: false },
          thursday: { open: '06:00', close: '22:00', closed: false },
          friday: { open: '06:00', close: '22:00', closed: false },
          saturday: { open: '08:00', close: '18:00', closed: false },
          sunday: { open: '08:00', close: '18:00', closed: false },
        },
        amenities: {
          hasParking: true,
          hasShowers: true,
          hasLockers: true,
          hasPool: false,
          hasSauna: false,
          hasWifi: true,
          hasChildcare: false,
          hasCafeteria: true,
        },
        socialMedia: {
          facebook: 'https://facebook.com/defaultgym',
          instagram: 'https://instagram.com/defaultgym',
        },
      });

      console.log('✅ Gym settings configured');

      // Step 4: Configure features
      console.log('\n🎨 Configuring gym features...');
      await this.onboardingService.configureFeatures(context as any, {
        gymId: onboardingResult.gym.id,
        clientManagement: {
          enabled: true,
          requireDocumentId: false,
          enablePhotos: true,
          trackEmergencyContacts: true,
          trackMedicalConditions: true,
        },
        membershipManagement: {
          enabled: true,
          allowCustomPricing: true,
          allowContractFreezing: true,
          expiryWarningDays: 30,
          autoRenewalReminders: true,
        },
        checkInSystem: {
          enabled: true,
          requireActiveContract: true,
          trackCheckInTime: true,
          allowMultiplePerDay: false,
        },
        evaluationSystem: {
          enabled: true,
          trackMeasurements: true,
          trackBodyComposition: true,
          trackPerformance: true,
          defaultFrequencyDays: 90,
        },
        leadManagement: {
          enabled: true,
          publicCatalogListing: true,
          enableOnlineForm: true,
          autoAssignLeads: false,
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          welcomeEmails: true,
          contractExpiryAlerts: true,
          evaluationReminders: true,
        },
      });

      console.log('✅ Features configured');

      // Step 5: Complete guided setup
      console.log('\n🏁 Completing guided setup...');
      await this.onboardingService.completeGuidedSetup(context as any, {
        gymId: onboardingResult.gym.id,
      });

      console.log('✅ Guided setup completed');

      // Display the created user information
      console.log('\n========================================');
      console.log('🎉 DEFAULT USER CREATED SUCCESSFULLY! 🎉');
      console.log('========================================');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('🆔 User ID:', onboardingResult.user.id);
      console.log('🏢 Organization:', onboardingResult.organization.name);
      console.log('🏋️  Gym:', onboardingResult.gym.name);
      console.log('✉️  Email Verified: Yes');
      console.log('🚀 Onboarding Status: Completed');
      console.log('🔐 Access Token:', onboardingResult.access_token.substring(0, 20) + '...');
      console.log('========================================\n');

      console.log('ℹ️  You can now login with these credentials and start using the system.');
    } catch (error: any) {
      console.error('❌ Error setting up default user:', error.message || error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      throw error;
    } finally {
      await this.prismaService.$disconnect();
      console.log('✅ Disconnected from database');
    }
  }
}
