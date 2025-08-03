import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { SupabaseService } from '../../core/auth/services/supabase.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { UserType } from '@gymspace/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationsService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Create invitation for collaborator
   */
  async createInvitation(dto: CreateInvitationDto, invitedByUserId: string) {
    // Verify gym exists and user has access
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: dto.gymId,
        organization: {
          ownerUserId: invitedByUserId,
        },
      },
      include: {
        organization: {
          include: {
            subscriptionPlan: true,
          },
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', dto.gymId);
    }

    // Check if we're within user limits
    const currentUsers = await this.prismaService.collaborator.count({
      where: {
        gymId: dto.gymId,
        status: 'active',
      },
    });

    if (currentUsers >= gym.organization.subscriptionPlan.maxUsersPerGym) {
      throw new BusinessException('User limit reached for this subscription plan');
    }

    // Check if user is already invited or exists
    const existingInvitation = await this.prismaService.invitation.findFirst({
      where: {
        email: dto.email,
        gymId: dto.gymId,
        status: 'pending',
      },
    });

    if (existingInvitation) {
      throw new BusinessException('An invitation has already been sent to this email');
    }

    // Check if user already exists as collaborator
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
      include: {
        collaborators: {
          where: { gymId: dto.gymId },
        },
      },
    });

    if (existingUser && existingUser.collaborators.length > 0) {
      throw new BusinessException('User is already a collaborator in this gym');
    }

    // Verify role exists
    const role = await this.prismaService.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new ResourceNotFoundException('Role', dto.roleId);
    }

    // Create invitation
    const token = uuidv4();
    const invitation = await this.prismaService.invitation.create({
      data: {
        gymId: dto.gymId,
        email: dto.email,
        roleId: dto.roleId,
        token,
        status: 'pending',
        invitedByUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdByUserId: invitedByUserId,
      },
      include: {
        gym: true,
        role: true,
      },
    });

    // TODO: Send invitation email
    // For now, we'll return the invitation link
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role.name,
      gym: invitation.gym.name,
      invitationLink: `/invite/${token}`,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accept invitation and create collaborator
   */
  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    // Find invitation
    const invitation = await this.prismaService.invitation.findUnique({
      where: { token },
      include: {
        gym: {
          include: {
            organization: true,
          },
        },
        role: true,
      },
    });

    if (!invitation) {
      throw new ResourceNotFoundException('Invitation', token);
    }

    // Check if invitation is valid
    if (invitation.status !== 'pending') {
      throw new BusinessException('This invitation has already been used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BusinessException('This invitation has expired');
    }

    try {
      // Create or get user
      let user = await this.prismaService.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        // Create new Supabase user
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

        // Create user in database
        user = await this.prismaService.user.create({
          data: {
            id: supabaseAuth.user!.id,
            email: invitation.email,
            name: dto.name,
            phone: dto.phone,
            password: '', // Password managed by Supabase
            userType: UserType.COLLABORATOR,
          },
        });
      }

      // Create collaborator and update invitation in transaction
      await this.prismaService.$transaction(async (tx) => {
        // Create collaborator
        const collaborator = await tx.collaborator.create({
          data: {
            userId: user!.id,
            gymId: invitation.gymId,
            roleId: invitation.roleId,
            status: 'active',
            hiredDate: new Date(),
            invitationId: invitation.id,
            createdByUserId: invitation.invitedByUserId,
          },
        });

        // Update invitation
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'accepted',
            acceptedByUserId: user!.id,
            acceptedAt: new Date(),
            updatedByUserId: user!.id,
          },
        });

        return collaborator;
      });

      return {
        message: 'Invitation accepted successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        gym: {
          id: invitation.gym.id,
          name: invitation.gym.name,
        },
        role: invitation.role.name,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to accept invitation');
    }
  }

  /**
   * Get pending invitations for a gym
   */
  async getGymInvitations(gymId: string, userId: string) {
    // Verify access
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        organization: {
          ownerUserId: userId,
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    return this.prismaService.invitation.findMany({
      where: {
        gymId,
        status: 'pending',
      },
      include: {
        role: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, userId: string) {
    const invitation = await this.prismaService.invitation.findFirst({
      where: {
        id: invitationId,
        gym: {
          organization: {
            ownerUserId: userId,
          },
        },
      },
    });

    if (!invitation) {
      throw new ResourceNotFoundException('Invitation', invitationId);
    }

    if (invitation.status !== 'pending') {
      throw new BusinessException('Cannot cancel this invitation');
    }

    await this.prismaService.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'expired',
        updatedByUserId: userId,
      },
    });

    return { message: 'Invitation cancelled successfully' };
  }

  /**
   * Scheduled task to mark expired invitations
   */
  @Cron('0 0 * * *') // Daily at midnight
  async markExpiredInvitations() {
    const expired = await this.prismaService.invitation.updateMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'expired',
      },
    });

    console.log(`Marked ${expired.count} invitations as expired`);
  }
}
