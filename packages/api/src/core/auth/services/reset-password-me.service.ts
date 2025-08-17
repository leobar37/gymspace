import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { IRequestContext } from '@gymspace/shared';
import { ValidationException, BusinessException } from '../../../common/exceptions';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { EmailService } from '../../email/email.service';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';

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
  private readonly RESET_CODE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly RESET_TOKEN_TTL = 20 * 60; // 20 minutes in seconds
  private readonly RESET_CODE_PREFIX = 'password_reset_code:';
  private readonly RESET_TOKEN_PREFIX = 'password_reset_token:';

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private cacheService: CacheService,
    private emailService: EmailService,
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

  /**
   * Generate a 6-digit reset code
   */
  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Request password reset - sends a code to the user's email
   * @param email - User's email address
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'Si el correo existe, recibirás un código de restablecimiento',
      };
    }

    // Generate reset code
    const resetCode = this.generateResetCode();

    // Store code in cache with email as key
    const cacheKey = `${this.RESET_CODE_PREFIX}${email}`;
    await this.cacheService.set(
      cacheKey,
      {
        code: resetCode,
        userId: user.id,
        attempts: 0,
        createdAt: new Date().toISOString(),
      },
      this.RESET_CODE_TTL,
    );

    // Send email with reset code
    await this.emailService.sendPasswordResetCode({
      to: user.email,
      name: user.name || 'Usuario',
      code: resetCode,
    });

    return {
      success: true,
      message: 'Si el correo existe, recibirás un código de restablecimiento',
    };
  }

  /**
   * Verify reset code and return a temporary token
   * @param email - User's email
   * @param code - Reset code from email
   */
  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<{ resetToken: string; expiresIn: number }> {
    const cacheKey = `${this.RESET_CODE_PREFIX}${email}`;
    console.log('the code', {
      code,
    });
    const storedData = (await this.cacheService.get(cacheKey)) as {
      code: string;
      userId: string;
      attempts: number;
      createdAt: string;
    } | null;

    if (!storedData) {
      throw new ValidationException([
        {
          field: 'code',
          message: 'Código inválido o expirado',
        },
      ]);
    }

    // Check attempts to prevent brute force
    if (storedData.attempts >= 5) {
      await this.cacheService.del(cacheKey);
      throw new ValidationException([
        {
          field: 'code',
          message: 'Demasiados intentos fallidos. Solicita un nuevo código',
        },
      ]);
    }

    // Verify code
    if (storedData.code !== code) {
      // Increment attempts
      await this.cacheService.set(
        cacheKey,
        {
          ...storedData,
          attempts: storedData.attempts + 1,
        },
        this.RESET_CODE_TTL,
      );

      throw new ValidationException([
        {
          field: 'code',
          message: 'Código incorrecto',
        },
      ]);
    }

    // Generate JWT token for password reset
    const resetToken = jwt.sign(
      {
        userId: storedData.userId,
        email: email,
        type: 'password_reset',
      },
      this.configService.get('app.jwtSecret') || 'default-secret-key',
      {
        expiresIn: this.RESET_TOKEN_TTL,
      },
    );

    // Store token in cache for validation
    const tokenCacheKey = `${this.RESET_TOKEN_PREFIX}${resetToken}`;
    await this.cacheService.set(
      tokenCacheKey,
      {
        userId: storedData.userId,
        email: email,
      },
      this.RESET_TOKEN_TTL * 1000,
    );

    // Delete the used code
    await this.cacheService.del(cacheKey);

    return {
      resetToken,
      expiresIn: this.RESET_TOKEN_TTL,
    };
  }

  /**
   * Reset password using the temporary token
   * @param resetToken - JWT token from code verification
   * @param newPassword - New password
   */
  async resetPasswordWithToken(
    resetToken: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate password strength
    this.validatePasswordStrength(newPassword);

    // Verify JWT token
    let tokenData;
    try {
      tokenData = jwt.verify(
        resetToken,
        this.configService.get('app.jwtSecret') || 'default-secret-key',
      ) as any;
    } catch (error) {
      throw new ValidationException([
        {
          field: 'resetToken',
          message: 'Token inválido o expirado',
        },
      ]);
    }

    // Check if token is in cache
    const tokenCacheKey = `${this.RESET_TOKEN_PREFIX}${resetToken}`;
    const cachedToken = await this.cacheService.get(tokenCacheKey);

    if (!cachedToken) {
      throw new ValidationException([
        {
          field: 'resetToken',
          message: 'Token inválido o ya utilizado',
        },
      ]);
    }

    // Update password in Supabase
    const { error: updateError } = await this.supabase.auth.admin.updateUserById(tokenData.userId, {
      password: newPassword,
    });

    if (updateError) {
      throw new BusinessException(`Error al restablecer la contraseña: ${updateError.message}`);
    }

    // Delete the used token
    await this.cacheService.del(tokenCacheKey);

    // Optionally send confirmation email
    const user = await this.prismaService.user.findUnique({
      where: { id: tokenData.userId },
      select: { email: true, name: true },
    });

    if (user) {
      await this.emailService.sendPasswordResetConfirmation({
        to: user.email,
        name: user.name || 'Usuario',
      });
    }

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente',
    };
  }

  /**
   * Resend password reset code
   * @param email - User's email address
   */
  async resendResetCode(email: string): Promise<{ success: boolean; message: string }> {
    // Check if there's an existing code
    const cacheKey = `${this.RESET_CODE_PREFIX}${email}`;
    const existingCode = (await this.cacheService.get(cacheKey)) as {
      code: string;
      userId: string;
      attempts: number;
      createdAt: string;
    } | null;

    if (existingCode) {
      // Check if we should rate limit
      const createdAt = new Date(existingCode.createdAt);
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();

      // Only allow resend after 1 minute
      if (timeDiff < 60000) {
        throw new ValidationException([
          {
            field: 'email',
            message: 'Por favor espera un minuto antes de solicitar un nuevo código',
          },
        ]);
      }

      // Delete existing code
      await this.cacheService.del(cacheKey);
    }

    // Request new code
    return this.requestPasswordReset(email);
  }
}
