import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/core/database/prisma.service';
import { RequestContext } from '~/common/services/request-context.service';
import { UpdateProfileDto, UserProfileDto } from './dto';
import {
  ResourceNotFoundException,
  ValidationException,
  AuthorizationException,
} from '~/common/exceptions';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the current user's profile
   * @param context Request context with authenticated user
   * @returns User profile data
   * @throws ResourceNotFoundException if user not found
   */
  async getProfile(context: RequestContext): Promise<UserProfileDto> {
    const userId = context.getUserId();

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ResourceNotFoundException('User', userId);
    }

    return this.mapToProfileDto(user);
  }

  /**
   * Update the current user's profile
   * @param context Request context with authenticated user
   * @param updateProfileDto Profile update data
   * @returns Updated user profile
   * @throws ResourceNotFoundException if user not found
   * @throws ValidationException if validation fails
   */
  async updateProfile(
    context: RequestContext,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const userId = context.getUserId();

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new ResourceNotFoundException('User', userId);
    }

    // Validate that the user is updating their own profile
    if (existingUser.id !== userId) {
      throw new AuthorizationException('You can only update your own profile');
    }

    // Prepare update data
    const updateData: any = {
      updatedByUserId: userId,
      updatedAt: new Date(),
    };

    if (updateProfileDto.name !== undefined) {
      updateData.name = updateProfileDto.name;
    }

    if (updateProfileDto.phone !== undefined) {
      updateData.phone = updateProfileDto.phone;
    }

    if (updateProfileDto.birthDate !== undefined) {
      updateData.birthDate = new Date(updateProfileDto.birthDate);
    }

    // Update the user profile
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });

    return this.mapToProfileDto(updatedUser);
  }

  /**
   * Map Prisma User to UserProfileDto
   * @param user Prisma user object
   * @returns User profile DTO
   */
  private mapToProfileDto(user: any): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      birthDate: user.birthDate,
      userType: user.userType,
      emailVerified: !!user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
