import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { BusinessException } from '../../common/exceptions';

@Injectable()
export class EmailService {
  private supabase: SupabaseClient;
  private resend: Resend;
  private fromEmail: string;
  private isDev: boolean;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseServiceKey = this.configService.get<string>('supabase.serviceKey');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase configuration is missing. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get dev mode configuration
    this.isDev = this.configService.get<boolean>('isDev');

    // Initialize Resend
    const resendApiKey = this.configService.get<string>('resend.apiKey');
    this.fromEmail = this.configService.get<string>('resend.fromEmail');

    // if (!resendApiKey && !this.isDev) {
    //   throw new Error(
    //     'Resend API key is missing. Please check RESEND_API_KEY environment variable.',
    //   );
    // }

    this.resend = new Resend(resendApiKey);
  }

  /**
   * Send verification code via email using Resend
   */
  async sendVerificationCode(email: string, code: string, name: string): Promise<void> {
    try {
      // Generate email content with the OTP code
      const emailContent = this.generateVerificationCodeEmail(code, name);

      // Send email using Resend
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Email Verification Code - GymSpace',
        html: emailContent,
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        throw new BusinessException('Failed to send verification email');
      }

      console.log(`Verification email sent successfully to ${email}. Email ID: ${result.data?.id}`);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      console.error('Error sending verification email:', error);
      throw new BusinessException('Failed to send verification email');
    }
  }

  /**
   * Send password reset code via email
   */
  async sendPasswordResetCode(params: { to: string; name: string; code: string }): Promise<void> {
    try {
      const emailContent = this.generatePasswordResetEmail(params.code, params.name);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [params.to],
        subject: 'Código de restablecimiento de contraseña - GymSpace',
        html: emailContent,
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        throw new BusinessException('Failed to send password reset email');
      }

      console.log(
        `Password reset email sent successfully to ${params.to}. Email ID: ${result.data?.id}`,
      );
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      console.error('Error sending password reset email:', error);
      throw new BusinessException('Failed to send password reset email');
    }
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmation(params: { to: string; name: string }): Promise<void> {
    try {
      const emailContent = this.generatePasswordResetConfirmationEmail(params.name);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [params.to],
        subject: 'Contraseña restablecida exitosamente - GymSpace',
        html: emailContent,
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        throw new BusinessException('Failed to send password reset confirmation');
      }

      console.log(`Password reset confirmation sent to ${params.to}. Email ID: ${result.data?.id}`);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      console.error('Error sending password reset confirmation:', error);
      throw new BusinessException('Failed to send password reset confirmation');
    }
  }

  /**
   * Generate password reset email content
   */
  private generatePasswordResetEmail(code: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecimiento de Contraseña - GymSpace</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GymSpace</h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gestión de gimnasios simplificada</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Restablecimiento de contraseña</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">Hola ${name},</p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para continuar:
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px;">
            <p style="color: #fff; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 5px;">${code}</p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Este código es válido por 15 minutos. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 14px; text-align: center;">
            Si tienes alguna pregunta, no dudes en contactarnos.<br>
            © 2024 GymSpace. Todos los derechos reservados.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset confirmation email content
   */
  private generatePasswordResetConfirmationEmail(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Restablecida - GymSpace</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GymSpace</h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gestión de gimnasios simplificada</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Contraseña restablecida exitosamente</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">Hola ${name},</p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 14px; text-align: center;">
            Si tienes alguna pregunta, no dudes en contactarnos.<br>
            © 2024 GymSpace. Todos los derechos reservados.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate verification code email content
   */
  private generateVerificationCodeEmail(code: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Correo Electrónico - GymSpace</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GymSpace</h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gestión de gimnasios simplificada</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Verificación de correo electrónico</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">Hola ${name},</p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Gracias por registrarte en GymSpace. Para completar tu registro, por favor utiliza el siguiente código de verificación:
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px;">
            <h1 style="color: #ffffff; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${code}</h1>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⏰ <strong>Importante:</strong> Este código expirará en 10 minutos por razones de seguridad.
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Si no solicitaste este código de verificación, por favor ignora este correo.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            Saludos cordiales,<br>
            <strong>El equipo de GymSpace</strong>
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 GymSpace. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send organization code via email using Resend
   */
  async sendOrganizationCode(
    email: string,
    organizationCode: string,
    organizationName: string,
    ownerName: string,
  ): Promise<void> {
    try {
      // Generate email content
      const emailContent = this.generateOrganizationCodeEmail(
        organizationCode,
        organizationName,
        ownerName,
      );

      // Send email using Resend
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `Welcome to GymSpace - Your Organization "${organizationName}" is Ready!`,
        html: emailContent,
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        throw new BusinessException('Failed to send organization code email');
      }

      console.log(
        `Organization code email sent successfully to ${email}. Email ID: ${result.data?.id}`,
      );
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      console.error('Error sending organization code email:', error);
      throw new BusinessException('Failed to send organization code email');
    }
  }

  /**
   * Generate organization code email content
   */
  private generateOrganizationCodeEmail(
    organizationCode: string,
    organizationName: string,
    ownerName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GymSpace - Organization Created</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GymSpace</h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gym Management Made Simple</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; margin-bottom: 30px; border-radius: 10px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎉 Welcome to GymSpace!</h2>
          </div>
          
          <p style="color: #555; font-size: 18px; line-height: 1.5; margin-bottom: 20px;">
            Hello <strong>${ownerName}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Congratulations! Your organization <strong>"${organizationName}"</strong> has been successfully created and is ready for action.
          </p>
          
          <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="color: #475569; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">YOUR ORGANIZATION CODE</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 24px; font-weight: bold; letter-spacing: 3px; padding: 15px; border-radius: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${organizationCode}
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
              🔐 Keep this code safe!
            </p>
            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
              You'll need this organization code to access your dashboard and manage your gym operations.
            </p>
          </div>
          
          <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 18px;">What you can do now:</h3>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Access your organization dashboard</strong> - Start managing your gym operations</li>
              <li><strong>Invite collaborators</strong> - Add team members to help run your gym</li>
              <li><strong>Set up your gym profile</strong> - Configure settings, hours, and amenities</li>
              <li><strong>Create membership plans</strong> - Define pricing and features for your members</li>
              <li><strong>Start onboarding clients</strong> - Begin growing your gym community</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; text-decoration: none; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              🚀 Get Started Now
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for choosing GymSpace to power your gym management needs. We're excited to be part of your journey!
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            Best regards,<br>
            <strong>The GymSpace Team</strong>
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 GymSpace. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate unique organization code
   */
  generateOrganizationCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORG-${timestamp}-${random}`;
  }
}
