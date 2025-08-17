import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { IRequestContext } from '@gymspace/shared';
import { ValidationException, BusinessException } from '../../../common/exceptions';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

@Injectable()
export class ResetPasswordMeService {
  private supabase: ReturnType<typeof createClient>;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get('supabase.url'),
      this.configService.get('supabase.serviceKey'),
    );
  }

  /**
   * Change the password for the authenticated user
   * @param context - Request context with authenticated user
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   */
  async changeMyPassword(
    context: IRequestContext,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const userId = context.getUserId();

    if (!userId) {
      throw new BusinessException('User not authenticated');
    }

    // Get user from database
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new BusinessException('User not found');
    }

    // First, verify the current password is correct by attempting to sign in
    // This is necessary because Supabase doesn't provide a direct way to verify the current password
    // when using service role key
    const { error: signInError, data } = await this.supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new ValidationException([
        {
          field: 'currentPassword',
          message: 'La contraseña actual es incorrecta',
        },
      ]);
    }

    // Update password using the admin API with service role key
    // We use updateUserById because we're using the service role key from the backend
    const { error: updateError } = await this.supabase.auth.admin.updateUserById(data.user.id, {
      password: newPassword,
    });

    if (updateError) {
      throw new BusinessException(`Error al actualizar la contraseña: ${updateError.message}`);
    }

    // Optional: You could also invalidate all existing sessions for this user
    // to force re-authentication with the new password
    // await this.supabase.auth.admin.signOut(userId, 'global');
  }

  /**
   * Validate password strength using Zod schema
   * @param password - Password to validate
   */
  validatePasswordStrength(password: string): void {
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: 'newPassword',
          message: err.message,
        }));
        throw new ValidationException(errors);
      }
      throw error;
    }
  }

  /**
   * Change password with validation using Zod
   * @param context - Request context
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  async changePasswordWithValidation(
    context: IRequestContext,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate both passwords using Zod schema
    try {
      changePasswordSchema.parse({
        currentPassword,
        newPassword,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationException(errors);
      }
      throw error;
    }

    // Change the password
    await this.changeMyPassword(context, currentPassword, newPassword);
    
    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
