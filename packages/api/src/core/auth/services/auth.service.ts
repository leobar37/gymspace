import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { EmailService } from '../../email/email.service';
import { UserType, Permission, SubscriptionStatus, PERMISSIONS } from '@gymspace/shared';
import {
  RegisterOwnerDto,
  LoginDto,
  LoginResponseDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RegisterCollaboratorDto,
} from '../../../modules/auth/dto';
import { BusinessException } from '../../../common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private cacheService: CacheService,
    private emailService: EmailService,
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
   * Get default gym for user (first active gym from their organization)
   */
  async getDefaultGymForUser(userId: string): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        ownedOrganizations: {
          include: {
            gyms: {
              where: {
                deletedAt: null,
                isActive: true,
              },
              orderBy: { createdAt: 'asc' },
              take: 1,
              include: {
                organization: true,
              },
            },
          },
        },
        collaborators: {
          where: { status: 'active' },
          include: {
            gym: {
              include: {
                organization: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    // If user is an owner and has active gyms in their organization
    if (user.userType === UserType.OWNER && user.ownedOrganizations?.length > 0) {
      const firstOrg = user.ownedOrganizations[0];
      if (firstOrg.gyms.length > 0) {
        return firstOrg.gyms[0];
      }
    }
    // If user is a collaborator with access to an active gym
    if (user.collaborators?.length > 0) {
      const activeCollaborator = user.collaborators.find(
        (c: any) => c.gym && c.gym.isActive && c.gym.deletedAt === null,
      );
      if (activeCollaborator) {
        return activeCollaborator.gym;
      }
    }

    return null;
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
        const ownerOrgTimestamp = Date.now().toString(36);
        const ownerOrgRandom = Math.random().toString(36).substring(2, 5);
        const organization = await tx.organization.create({
          data: {
            name: dto.organizationName,
            organizationCode: `ORG-${ownerOrgTimestamp.toUpperCase()}-${ownerOrgRandom.toUpperCase()}`,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            country: dto.country || 'US',
            currency: dto.currency || 'USD',
            timezone: dto.timezone || 'America/New_York',
            settings: {},
            owner: { connect: { id: user.id } },
            subscriptionPlan: { connect: { id: dto.subscriptionPlanId } },
            createdBy: { connect: { id: user.id } },
          },
        });

        // Create default gym
        const gymTimestamp = Date.now().toString(36).toUpperCase();
        const gymRandom = Math.random().toString(36).substring(2, 5).toUpperCase();
        const gym = await tx.gym.create({
          data: {
            organizationId: organization.id,
            name: 'Default',
            slug: `default-${gymTimestamp.toLowerCase()}-${gymRandom.toLowerCase()}`,
            gymCode: `GYM-${gymTimestamp}-${gymRandom}`,
            settings: {
              setupCompleted: false,
              features: {},
            },
            createdByUserId: user.id,
          },
        });

        return { user, organization, gym };
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
        gym: {
          id: result.gym.id,
          name: result.gym.name,
        },
      };
    } catch (error) {
      // Cleanup Supabase user if database operation fails
      if (error instanceof BusinessException || error instanceof ConflictException) {
        throw error;
      }
      throw new BusinessException('Error en el registro. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Login user
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    try {
      console.log({
        dto,
      });

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email: dto.email,
          password: dto.password,
        });

      console.log(authError);

      if (authError) {
        throw new UnauthorizedException(
          'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
        );
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
   * Verify email with our stored verification code
   */
  async verifyEmail(dto: VerifyEmailDto) {
    try {
      // Find user with verification code
      const user = await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

      console.log(user);

      if (!user) {
        throw new BusinessException('User not found');
      }

      // Check if verification code matches and is not expired
      if (!user.verificationCode || user.verificationCode !== dto.code) {
        throw new BusinessException('Invalid verification code');
      }

      if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
        throw new BusinessException('Verification code has expired');
      }

      // Clear verification code and mark as verified
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
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
   * Generate and send verification code for email registration
   */
  async generateAndSendVerificationCode(
    email: string,
    name: string,
  ): Promise<{ verificationCode: string }> {
    try {
      // Generate 6-digit verification code
      const verificationCode = this.emailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Check if user already exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.emailVerifiedAt) {
        throw new BusinessException('Email already verified and registered');
      }

      // Create or update user with verification code
      await this.prismaService.user.upsert({
        where: { email },
        create: {
          id: `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`, // Temporary ID
          email,
          name,
          userType: UserType.OWNER,
          verificationCode,
          verificationCodeExpiresAt: expiresAt,
        },
        update: {
          verificationCode,
          verificationCodeExpiresAt: expiresAt,
          name, // Update name in case it changed
        },
      });

      // Send verification code via email
      await this.emailService.sendVerificationCode(email, verificationCode, name);

      return { verificationCode };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to generate and send verification code');
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

    // Use the same logic as generateAndSendVerificationCode
    await this.resendVerificationCode(dto.email, user.name);

    return {
      success: true,
      message: 'Verification code sent',
    };
  }

  /**
   * Resend verification code for email registration
   * Similar to generateAndSendVerificationCode but for existing users
   */
  async resendVerificationCode(email: string, name: string): Promise<{ verificationCode: string }> {
    try {
      // Generate new 6-digit verification code
      const verificationCode = this.emailService.generateVerificationCode();

      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now

      // Check if user exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email },
      });

      // Debug logging
      console.log(`Resending verification code for user: ${email}`);

      if (!existingUser) {
        throw new BusinessException('User not found');
      }

      if (existingUser.emailVerifiedAt) {
        throw new BusinessException('Email already verified');
      }

      // Update user with new verification code
      await this.prismaService.user.update({
        where: { email },
        data: {
          verificationCode,
          verificationCodeExpiresAt: expiresAt,
          name, // Update name in case it changed
        },
      });

      // Send verification code via email
      await this.emailService.sendVerificationCode(email, verificationCode, name);

      return { verificationCode };
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
    await this.validateInvitation(dto.invitationToken);
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
      throw new BusinessException('Error en el registro. Por favor, inténtalo de nuevo.');
    }
  }
}
