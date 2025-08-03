import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.serviceKey');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase configuration is missing. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<any> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }

    return data.user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`User not found: ${error.message}`);
    }

    return data.user;
  }

  /**
   * Create invitation link
   */
  async createInvitationLink(email: string): Promise<string> {
    const { data, error } = await this.supabase.auth.admin.generateLink({
      type: 'invite',
      email,
    });

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    return data.properties.hashed_token;
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(userId: string, metadata: any): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });

    if (error) {
      throw new Error(`Failed to update user metadata: ${error.message}`);
    }
  }
}
