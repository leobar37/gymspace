import { BaseResource } from './base';
import { UserProfileDto, UpdateProfileDto } from '../models/users';
import { RequestOptions } from '../types';

export class UsersResource extends BaseResource {
  /**
   * Get the current user's profile
   * @param options - Request options
   * @returns User profile data
   */
  async getProfile(options?: RequestOptions): Promise<UserProfileDto> {
    return this.client.get<UserProfileDto>('/users/profile', undefined, options);
  }

  /**
   * Update the current user's profile
   * @param data - Profile update data
   * @param options - Request options
   * @returns Updated user profile
   */
  async updateProfile(
    data: UpdateProfileDto,
    options?: RequestOptions
  ): Promise<UserProfileDto> {
    return this.client.put<UserProfileDto>('/users/profile', data, options);
  }
}