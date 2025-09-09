import { Injectable } from '@nestjs/common';
import { Gym } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { RequestContext } from 'src/common/services/request-context.service';
import { ResourceNotFoundException } from 'src/common/exceptions';

@Injectable()
export class BaseGymService {
  constructor(protected readonly prismaService: PrismaService) {}

  /**
   * Find a gym by ID with owner validation
   * Validates that the gym exists and belongs to the user's organization
   */
  async findGymByIdWithOwnerValidation(
    context: RequestContext,
    gymId: string,
  ): Promise<Gym> {
    const userId = context.getUserId();

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

    return gym;
  }

  /**
   * Find a gym by ID with basic access validation
   * Validates that the gym exists and user has access (owner only for now)
   */
  async findGymByIdWithAccess(
    context: RequestContext,
    gymId: string,
  ): Promise<Gym> {
    const userId = context.getUserId();

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

    return gym;
  }

  /**
   * Find a gym with full details including organization
   */
  async findGymWithDetails(
    context: RequestContext,
    gymId: string,
  ): Promise<Gym & { organization: any }> {
    const userId = context.getUserId();

    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        organization: {
          ownerUserId: userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    return gym;
  }

  /**
   * Check if user has access to a specific gym
   */
  async hasGymAccess(
    context: RequestContext,
    gymId: string,
  ): Promise<boolean> {
    const userId = context.getUserId();

    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        organization: {
          ownerUserId: userId,
        },
      },
    });

    return !!gym;
  }

  /**
   * Validate gym belongs to the user's organization
   */
  async validateGymOwnership(
    context: RequestContext,
    gymId: string,
  ): Promise<void> {
    const hasAccess = await this.hasGymAccess(context, gymId);
    
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }
  }
}