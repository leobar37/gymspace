import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { UserType, Permission, SubscriptionStatus, PERMISSIONS } from '@gymspace/shared';
import { 
  RegisterOwnerDto, 
  LoginDto, 
  LoginResponseDto,
  VerifyEmailDto,
  ResendVerificationDto,
  CompleteOnboardingDto,
  RegisterCollaboratorDto
} from '../../../modules/auth/dto';
import { BusinessException } from '../../../common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Validate JWT token and return user
   */
  async validateToken(token: string): Promise<any> {
    try {
      // Verify token with Supabase
      const supabaseUser = await this.supabaseService.verifyToken(token);

      // Get or sync user in our database
      const user = await this.getOrSyncUser(supabaseUser);

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Get user permissions for a specific gym
   */
  async getUserPermissions(userId: string, gymId?: string): Promise<Permission[]> {
    // Check cache first
    if (gymId) {
      const cached = await this.cacheService.getUserPermissions(userId, gymId);
      if (cached) {
        return cached as Permission[];
      }
    }

    // Get user with collaborator info
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        collaborators: {
          where: gymId ? { gymId } : undefined,
          include: {
            role: true,
          },
        },
        ownedOrganizations: true,
      },
    });

    if (!user) {
      return [];
    }

    let permissions: Permission[] = [];

    // Owner has all permissions
    if (user.userType === UserType.OWNER) {
      permissions = Object.values(PERMISSIONS) as Permission[];
    } else if (user.collaborators.length > 0) {
      // Get permissions from role
      const role = user.collaborators[0].role;
      permissions = role.permissions as Permission[];
    }

    // Cache permissions
    if (gymId && permissions.length > 0) {
      await this.cacheService.cacheUserPermissions(userId, gymId, permissions);
    }

    return permissions;
  }

  /**
   * Get or sync user from Supabase
   */
  private async getOrSyncUser(supabaseUser: any): Promise<any> {
    let user = await this.prismaService.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      // Create user from Supabase data
      user = await this.prismaService.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email,
          phone: supabaseUser.user_metadata?.phone,
          userType: supabaseUser.user_metadata?.userType || UserType.COLLABORATOR,
          emailVerifiedAt: supabaseUser.email_confirmed_at
            ? new Date(supabaseUser.email_confirmed_at)
            : null,
        },
      });
    }

    return user;
  }

  /**
   * Get gym context for user
   */
  async getGymContext(gymId: string, userId: string): Promise<any> {
    // Check if user has access to gym
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        OR: [
          // Owner access
          {
            organization: {
              ownerUserId: userId,
            },
          },
          // Collaborator access
          {
            collaborators: {
              some: {
                userId,
                status: 'active',
              },
            },
          },
        ],
      },
      include: {
        organization: true,
      },
    });

    if (!gym) {
      throw new UnauthorizedException('Access denied to this gym');
    }

    return gym;
  }

  /**
   * Register a new owner with organization
   */
  async registerOwner(dto: RegisterOwnerDto) {
    // Check if email already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate subscription plan
    const subscriptionPlan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id: dto.subscriptionPlanId },
    });

    if (!subscriptionPlan) {
      throw new BusinessException('Invalid subscription plan');
    }

    try {
      // Create Supabase user
      const { data: supabaseAuth, error: authError } = await this.supabaseService
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

      // Create user, organization in a transaction
      const result = await this.prismaService.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            id: supabaseAuth.user!.id,
            email: dto.email,
            name: dto.name,
            phone: dto.phone,
            password: '', // Password is managed by Supabase
            userType: UserType.OWNER,
            emailVerifiedAt: null, // Will be set after email verification
          },
        });

        // Create organization
        const organization = await tx.organization.create({
          data: {
            ownerUserId: user.id,
            name: dto.organizationName,
            subscriptionPlanId: dto.subscriptionPlanId,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            country: dto.country || 'US',
            currency: dto.currency || 'USD',
            timezone: dto.timezone || 'America/New_York',
            settings: {},
            createdByUserId: user.id,
          },
        });

        return { user, organization };
      });

      return {
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
        },
      };
    } catch (error) {
      // Cleanup Supabase user if database operation fails
      if (error instanceof BusinessException || error instanceof ConflictException) {
        throw error;
      }
      throw new BusinessException('Registration failed. Please try again.');
    }
  }

  /**
   * Login user
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email: dto.email,
          password: dto.password,
        });

      if (authError) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user details
      const user = await this.prismaService.user.findUnique({
        where: { id: authData.user!.id },
        include: {
          ownedOrganizations: true,
          collaborators: {
            include: {
              gym: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Determine redirect path based on user type
      let redirectPath = '/dashboard';
      if (user.userType === UserType.OWNER) {
        redirectPath = '/owner/dashboard';
      } else if (user.collaborators.length > 0) {
        redirectPath = `/gym/${user.collaborators[0].gymId}/dashboard`;
      }

      return {
        access_token: authData.session!.access_token,
        refresh_token: authData.session!.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
        },
        redirectPath,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.refreshSession({ refresh_token: refreshToken });

      if (error) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Verify email with OTP code
   */
  async verifyEmail(dto: VerifyEmailDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.verifyOtp({
          email: dto.email,
          token: dto.code,
          type: 'signup',
        });

      if (error) {
        throw new BusinessException('Invalid or expired verification code');
      }

      // Update email verified status in database
      await this.prismaService.user.update({
        where: { email: dto.email },
        data: { emailVerifiedAt: new Date() },
      });

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Email verification failed');
    }
  }

  /**
   * Resend email verification code
   */
  async resendVerification(dto: ResendVerificationDto) {
    // Check if user exists and is not verified
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BusinessException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new BusinessException('Email already verified');
    }

    try {
      const { error } = await this.supabaseService
        .getClient()
        .auth.resend({
          type: 'signup',
          email: dto.email,
        });

      if (error) {
        throw new BusinessException('Failed to resend verification code');
      }

      return {
        success: true,
        message: 'Verification code sent',
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to resend verification code');
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans() {
    const plans = await this.prismaService.subscriptionPlan.findMany({
      where: { deletedAt: null },
      orderBy: { price: 'asc' },
    });

    return { data: plans };
  }

  /**
   * Complete owner onboarding
   */
  async completeOnboarding(dto: CompleteOnboardingDto) {
    // Verify email first
    await this.verifyEmail({
      email: dto.email,
      code: dto.verificationCode,
    });

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Validate subscription plan
    const subscriptionPlan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id: dto.subscriptionPlanId },
    });

    if (!subscriptionPlan) {
      throw new BusinessException('Invalid subscription plan');
    }

    try {
      // Create everything in a transaction
      const result = await this.prismaService.$transaction(async (tx) => {
        // Create Supabase user
        const { data: supabaseAuth, error: authError } = await this.supabaseService
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
            emailVerifiedAt: new Date(),
          },
        });

        // Create organization
        const organization = await tx.organization.create({
          data: {
            ownerUserId: user.id,
            name: dto.organizationName,
            subscriptionPlanId: dto.subscriptionPlanId,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            country: dto.country,
            currency: dto.currency,
            timezone: 'America/Lima', // Default timezone
            settings: {},
            createdByUserId: user.id,
          },
        });

        // Create first gym
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 5);
        const gym = await tx.gym.create({
          data: {
            organization: { connect: { id: organization.id } },
            name: dto.gym.name,
            slug: `${dto.gym.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}`,
            gymCode: `GYM-${timestamp.toUpperCase()}-${random.toUpperCase()}`,
            address: dto.gym.address,
            phone: dto.gym.phone,
            description: dto.gym.description,
            settings: {
              logo: dto.gym.logo,
              coverPhoto: dto.gym.coverPhoto,
            },
            createdBy: { connect: { id: user.id } },
          },
        });

        return { user, organization, gym, session: supabaseAuth.session };
      });

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
        },
        gym: {
          id: result.gym.id,
          name: result.gym.name,
        },
        redirectPath: `/gym/${result.gym.id}/dashboard`,
      };
    } catch (error) {
      if (error instanceof BusinessException || error instanceof ConflictException) {
        throw error;
      }
      throw new BusinessException('Onboarding failed. Please try again.');
    }
  }

  /**
   * Validate invitation token
   */
  async validateInvitation(token: string) {
    const invitation = await this.prismaService.invitation.findUnique({
      where: { token },
      include: {
        gym: {
          include: {
            organization: true,
          },
        },
        role: true,
        invitedBy: true,
      },
    });

    if (!invitation) {
      throw new BusinessException('Invalid invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BusinessException('Invitation already used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BusinessException('Invitation expired');
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        gymName: invitation.gym.name,
        gymLogo: (invitation.gym.settings as any)?.logo || null,
        gymAddress: invitation.gym.address,
        inviterName: invitation.invitedBy.name,
        inviterRole: 'Administrador', // TODO: Get actual role
        role: invitation.role.name,
        permissions: invitation.role.permissions,
        expiresAt: invitation.expiresAt,
        email: invitation.email,
      },
    };
  }

  /**
   * Register collaborator with invitation
   */
  async registerCollaborator(dto: RegisterCollaboratorDto): Promise<LoginResponseDto> {
    // Validate invitation
    const invitationData = await this.validateInvitation(dto.invitationToken);
    const invitation = await this.prismaService.invitation.findUnique({
      where: { token: dto.invitationToken },
    });

    if (!invitation) {
      throw new BusinessException('Invalid invitation');
    }

    try {
      // Create Supabase user
      const { data: supabaseAuth, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email: invitation.email,
          password: dto.password,
          options: {
            data: {
              name: dto.name,
              phone: dto.phone,
              userType: UserType.COLLABORATOR,
            },
          },
        });

      if (authError) {
        throw new BusinessException(`Authentication error: ${authError.message}`);
      }

      // Create user and collaborator in transaction
      const result = await this.prismaService.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            id: supabaseAuth.user!.id,
            email: invitation.email,
            name: dto.name,
            phone: dto.phone,
            password: '', // Password is managed by Supabase
            userType: UserType.COLLABORATOR,
            emailVerifiedAt: new Date(), // Auto-verified since they have invitation
          },
        });

        // Create collaborator
        const collaborator = await tx.collaborator.create({
          data: {
            userId: user.id,
            gymId: invitation.gymId,
            roleId: invitation.roleId,
            status: 'active',
            createdByUserId: invitation.invitedByUserId,
          },
        });

        // Update invitation status
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
        });

        return { user, collaborator };
      });

      return {
        access_token: supabaseAuth.session!.access_token,
        refresh_token: supabaseAuth.session!.refresh_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          userType: result.user.userType,
        },
        redirectPath: `/gym/${invitation.gymId}/dashboard`,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Registration failed. Please try again.');
    }
  }
}
