import { IRequestContext, SubscriptionStatus, UserType } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import { DurationPeriod, SubscriptionPlan } from '@prisma/client';
import {
  BusinessException,
  ResourceNotFoundException,
  ValidationException,
} from '../../common/exceptions';
import { AuthService } from '../../core/auth/services/auth.service';
import { PrismaService } from '../../core/database/prisma.service';
import { EmailService } from '../../core/email/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  CompleteGuidedSetupDto,
  ConfigureFeaturesDto,
  OnboardingStatusDto,
  OnboardingStep,
  StartOnboardingDto,
  UpdateGymSettingsDto,
} from './dto';
import ms from 'ms';

@Injectable()
export class OnboardingService {
  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
    private subscriptionsService: SubscriptionsService,
    private emailService: EmailService,
  ) {}

  /**
   * Calculate subscription end date based on plan duration
   * This method is reusable when user changes plans
   */
  static calculateSubscriptionEndDate(
    startDate: Date,
    plan: Pick<SubscriptionPlan, 'duration' | 'durationPeriod'>,
  ): Date {
    const endDate = new Date(startDate);

    if (plan.duration && plan.durationPeriod) {
      if (plan.durationPeriod === DurationPeriod.DAY) {
        endDate.setTime(endDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
      } else if (plan.durationPeriod === DurationPeriod.MONTH) {
        endDate.setMonth(endDate.getMonth() + plan.duration);
      }
    } else {
      // Default to 30 days if no duration specified
      endDate.setTime(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return endDate;
  }

  /**
   * Start the onboarding process - creates organization, user, and initial gym
   */
  async startOnboarding(dto: StartOnboardingDto) {
    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ValidationException([
        { field: 'email', message: 'User already exists with this email' },
      ]);
    }

    // Get subscription plan ID - use default free plan if not provided
    let subscriptionPlanId = dto.subscriptionPlanId;

    if (!subscriptionPlanId) {
      const defaultPlan = await this.subscriptionsService.getDefaultFreePlan();
      subscriptionPlanId = defaultPlan.id;
    }

    // Validate subscription plan
    const subscriptionPlan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId },
    });

    if (!subscriptionPlan) {
      throw new ResourceNotFoundException('Subscription');
    }

    // Ensure it's a free plan (for now only free plans are allowed)
    const isFreePlan = this.isFreePlan(subscriptionPlan.price);
    if (!isFreePlan) {
      throw new ValidationException([
        { field: 'subscriptionPlanId', message: 'Only free plans are allowed at this time' },
      ]);
    }
    const verificationCode = this.emailService.generateVerificationCode();
    try {
      // Create everything in a transaction
      const result = await this.prismaService.$transaction(async (tx) => {
        // Create Supabase user
        const supabaseService = (this.authService as any).supabaseService;
        const { data: supabaseAuth, error: authError } = await supabaseService
          .getClient()
          .auth.signUp({
            email: dto.email,
            password: dto.password,
            options: {
              data: {
                name: dto.name,
                phone: dto.phone,
                userType: UserType.OWNER,
              },
            },
          });

        if (authError) {
          throw new BusinessException(`Authentication error: ${authError.message}`);
        }

        // Create user
        const user = await tx.user.create({
          data: {
            id: supabaseAuth.user!.id,
            email: dto.email,
            name: dto.name,
            phone: dto.phone,
            password: '', // Password is managed by Supabase
            userType: UserType.OWNER,
            emailVerifiedAt: null,
            verificationCode: verificationCode,
            verificationCodeExpiresAt: new Date(Date.now() + ms('3h')), // 3 hours from now
          },
        });

        // Generate unique organization code
        const organizationCode = this.emailService.generateOrganizationCode();

        // Calculate subscription end date based on plan duration
        const subscriptionStartDate = new Date();
        const subscriptionEndDate = OnboardingService.calculateSubscriptionEndDate(
          subscriptionStartDate,
          subscriptionPlan,
        );

        // Create organization
        const organization = await tx.organization.create({
          data: {
            ownerUserId: user.id,
            name: dto.organizationName,
            organizationCode: organizationCode,
            country: dto.country,
            currency: dto.currency,
            timezone: dto.timezone,
            settings: {
              onboardingStep: OnboardingStep.ACCOUNT_CREATED,
              onboardingCompleted: false,
            },
            createdByUserId: user.id,
          },
        });

        // Create subscription organization link
        await tx.subscriptionOrganization.create({
          data: {
            organizationId: organization.id,
            subscriptionPlanId: subscriptionPlanId,
            status: SubscriptionStatus.ACTIVE,
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            isActive: true,
            createdByUserId: user.id,
          },
        });

        // Create initial gym with minimal data
        const gym = await tx.gym.create({
          data: {
            organizationId: organization.id,
            name: `${dto.organizationName} - Main Location`,
            slug: this.generateSlug(`${dto.organizationName}-main`),
            gymCode: this.generateGymCode(),
            settings: {
              setupCompleted: false,
              features: {},
            },
            createdByUserId: user.id,
          },
        });

        return { user, organization, gym, session: supabaseAuth.session };
      });

      // Generate and send verification code after successful onboarding
      try {
        await this.emailService.sendVerificationCode(
          result.user.email,
          verificationCode,
          result.user.name,
        );
      } catch (emailError) {
        // Log email error but don't fail the onboarding process
        console.error('Failed to send verification code email:', emailError);
      }

      return {
        success: true,
        access_token: result.session!.access_token,
        refresh_token: result.session!.refresh_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          userType: result.user.userType,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          organizationCode: result.organization.organizationCode,
        },
        gym: {
          id: result.gym.id,
          name: result.gym.name,
        },
        onboardingStatus: await this.getOnboardingStatus(result.organization.id, result.gym.id),
      };
    } catch (error) {
      if (error instanceof BusinessException || error instanceof ValidationException) {
        throw error;
      }
      throw new BusinessException('Failed to complete onboarding setup');
    }
  }

  /**
   * Update gym settings during onboarding
   */
  async updateGymSettings(context: IRequestContext, dto: UpdateGymSettingsDto) {
    const userId = context.user.id;

    // Verify gym ownership
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: dto.gymId,
        organization: {
          ownerUserId: userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym not found or access denied');
    }

    // Update gym with all settings
    const updatedGym = await this.prismaService.gym.update({
      where: { id: dto.gymId },
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        phone: dto.phone,
        email: dto.email,
        capacity: dto.capacity,
        description: dto.description,
        openingTime: dto.businessHours.monday.open, // Default opening time
        closingTime: dto.businessHours.monday.close, // Default closing time
        socialMedia: dto.socialMedia as any,
        settings: {
          ...(gym.settings as object),
          businessHours: dto.businessHours as any,
          logo: dto.logo,
          coverPhoto: dto.coverPhoto,
          primaryColor: dto.primaryColor,
          gymSettingsCompleted: true,
        } as any,
        updatedByUserId: userId,
      },
    });

    // Update organization onboarding step
    await this.prismaService.organization.update({
      where: { id: gym.organizationId },
      data: {
        settings: {
          ...(gym.organization.settings as object),
          onboardingStep: OnboardingStep.GYM_SETTINGS,
        },
      },
    });

    return {
      success: true,
      gym: updatedGym,
      onboardingStatus: await this.getOnboardingStatus(gym.organizationId, gym.id),
    };
  }

  /**
   * Configure gym features during onboarding
   */
  async configureFeatures(context: IRequestContext, dto: ConfigureFeaturesDto) {
    const userId = context.user.id;

    // Verify gym ownership
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: dto.gymId,
        organization: {
          ownerUserId: userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym not found or access denied');
    }

    // Update gym features
    const updatedGym = await this.prismaService.gym.update({
      where: { id: dto.gymId },
      data: {
        settings: {
          ...(gym.settings as object),
          features: {
            clientManagement: dto.clientManagement,
            membershipManagement: dto.membershipManagement,
            checkInSystem: dto.checkInSystem,
            evaluationSystem: dto.evaluationSystem,
            leadManagement: dto.leadManagement,
            notifications: dto.notifications,
          },
          featuresConfigured: true,
        } as any,
        catalogVisibility: dto.leadManagement.publicCatalogListing,
        updatedByUserId: userId,
      },
    });

    // Update organization onboarding step
    await this.prismaService.organization.update({
      where: { id: gym.organizationId },
      data: {
        settings: {
          ...(gym.organization.settings as object),
          onboardingStep: OnboardingStep.FEATURES_CONFIGURED,
        },
      },
    });

    // Create default membership plans if membership management is enabled
    if (dto.membershipManagement.enabled) {
      await this.createDefaultMembershipPlans(dto.gymId, userId);
    }

    return {
      success: true,
      gym: updatedGym,
      onboardingStatus: await this.getOnboardingStatus(gym.organizationId, gym.id),
    };
  }

  /**
   * Complete the guided setup
   */
  async completeGuidedSetup(context: IRequestContext, dto: CompleteGuidedSetupDto) {
    const userId = context.user.id;

    // Verify gym ownership and check if all steps are completed
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: dto.gymId,
        organization: {
          ownerUserId: userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym not found or access denied');
    }

    const settings = gym.settings as any;

    // Verify all steps are completed
    if (!settings?.gymSettingsCompleted || !settings?.featuresConfigured) {
      throw new ValidationException([
        {
          field: 'onboarding',
          message: 'Please complete all onboarding steps before finishing setup',
        },
      ]);
    }

    // Mark onboarding as completed
    await this.prismaService.$transaction(async (tx) => {
      // Update gym
      await tx.gym.update({
        where: { id: dto.gymId },
        data: {
          settings: {
            ...settings,
            setupCompleted: true,
            onboardingCompletedAt: new Date(),
          },
          updatedByUserId: userId,
        },
      });

      // Update organization
      await tx.organization.update({
        where: { id: gym.organizationId },
        data: {
          settings: {
            ...(gym.organization.settings as object),
            onboardingStep: OnboardingStep.COMPLETED,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
          },
        },
      });
    });

    return {
      success: true,
      message: 'Congratulations! Your gym setup is complete.',
      onboardingStatus: {
        organizationId: gym.organizationId,
        gymId: gym.id,
        currentStep: OnboardingStep.COMPLETED,
        accountCreated: true,
        gymSettingsCompleted: true,
        featuresConfigured: true,
        isCompleted: true,
        nextAction: 'Start managing your gym',
        completionPercentage: 100,
      } as OnboardingStatusDto,
    };
  }

  /**
   * Get current onboarding status
   */
  async getOnboardingStatus(organizationId: string, gymId: string): Promise<OnboardingStatusDto> {
    const org = await this.prismaService.organization.findUnique({
      where: { id: organizationId },
    });

    const gym = await this.prismaService.gym.findUnique({
      where: { id: gymId },
    });

    if (!org || !gym) {
      throw new ResourceNotFoundException('Organization or gym not found');
    }

    const orgSettings = (org.settings as any) || {};
    const gymSettings = (gym.settings as any) || {};

    const accountCreated = true; // If we can query, account is created
    const gymSettingsCompleted = gymSettings.gymSettingsCompleted || false;
    const featuresConfigured = gymSettings.featuresConfigured || false;
    const isCompleted = orgSettings.onboardingCompleted || false;

    let currentStep = OnboardingStep.ACCOUNT_CREATED;
    let nextAction = 'Configure your gym settings';
    let completionPercentage = 25;

    if (gymSettingsCompleted) {
      currentStep = OnboardingStep.GYM_SETTINGS;
      nextAction = 'Configure gym features';
      completionPercentage = 50;
    }

    if (featuresConfigured) {
      currentStep = OnboardingStep.FEATURES_CONFIGURED;
      nextAction = 'Complete setup';
      completionPercentage = 75;
    }

    if (isCompleted) {
      currentStep = OnboardingStep.COMPLETED;
      nextAction = 'Start managing your gym';
      completionPercentage = 100;
    }

    return {
      organizationId,
      gymId,
      currentStep,
      accountCreated,
      gymSettingsCompleted,
      featuresConfigured,
      isCompleted,
      nextAction,
      completionPercentage,
    };
  }

  /**
   * Create default membership plans
   */
  private async createDefaultMembershipPlans(gymId: string, userId: string) {
    const defaultPlans = [
      {
        name: 'Pase Diario',
        basePrice: 5.99,
        durationDays: 1,
        description: 'Acceso completo a las instalaciones del gimnasio por un día',
        features: [
          'Acceso ilimitado al gimnasio',
          'Acceso a todo el equipamiento',
          'Acceso a vestuarios',
        ],
      },
      {
        name: 'Membresía Semanal',
        basePrice: 19.99,
        durationDays: 7,
        description: 'Acceso completo a las instalaciones del gimnasio por una semana',
        features: [
          'Acceso ilimitado al gimnasio',
          'Acceso a todo el equipamiento',
          'Acceso a vestuarios',
        ],
      },
      {
        name: 'Membresía Mensual',
        basePrice: 49.99,
        durationMonths: 1,
        description: 'Acceso completo a las instalaciones del gimnasio por un mes',
        features: [
          'Acceso ilimitado al gimnasio',
          'Acceso a todo el equipamiento',
          'Acceso a vestuarios',
        ],
      },
      {
        name: 'Membresía Trimestral',
        basePrice: 129.99,
        durationMonths: 3,
        description: 'Acceso completo a las instalaciones del gimnasio por tres meses',
        features: [
          'Acceso ilimitado al gimnasio',
          'Acceso a todo el equipamiento',
          'Acceso a vestuarios',
          '10% de descuento',
        ],
      },
      {
        name: 'Membresía Anual',
        basePrice: 449.99,
        durationMonths: 12,
        description: 'Acceso completo a las instalaciones del gimnasio por un año',
        features: [
          'Acceso ilimitado al gimnasio',
          'Acceso a todo el equipamiento',
          'Acceso a vestuarios',
          '20% de descuento',
          'Pases de invitado gratuitos',
        ],
      },
    ];

    for (const plan of defaultPlans) {
      await this.prismaService.gymMembershipPlan.create({
        data: {
          gymId,
          name: plan.name,
          basePrice: plan.basePrice,
          durationMonths: plan.durationMonths || null,
          durationDays: plan.durationDays || null,
          description: plan.description,
          features: plan.features,
          status: 'active',
          showInCatalog: true,
          createdByUserId: userId,
        },
      });
    }
  }

  /**
   * Generate unique slug for gym
   */
  private generateSlug(base: string): string {
    const timestamp = Date.now().toString(36);
    return `${base.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}`;
  }

  /**
   * Generate unique gym code
   */
  private generateGymCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `GYM-${timestamp}-${random}`;
  }

  /**
   * Helper method to check if a plan is free
   */
  private isFreePlan(price: any): boolean {
    if (!price || typeof price !== 'object') {
      return false;
    }

    // Check if all currency values are 0
    return Object.values(price).every((currencyInfo: any) => {
      return currencyInfo.value === 0;
    });
  }
}
