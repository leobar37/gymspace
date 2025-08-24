import { IsString, IsEmail, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionWithPaymentDto {
  @ApiProperty({
    description: 'ID of the new subscription plan to upgrade to',
    example: 'uuid-of-new-plan',
  })
  @IsUUID()
  newPlanId: string;

  @ApiProperty({
    description: 'Customer email address for payment notifications',
    example: 'customer@example.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    description: 'URL to redirect after payment completion',
    example: 'https://yourdomain.com/subscription/upgrade/success',
  })
  @IsUrl()
  backUrl: string;
}

export class SubscriptionActionResponseDto {
  @ApiProperty({
    description: 'Payment URL for client redirection',
    example: 'https://mercadopago.com/checkout/...',
  })
  paymentUrl: string;

  @ApiProperty({
    description: 'MercadoPago subscription ID or internal subscription ID',
    example: 'MP-SUB-123456789',
  })
  subscriptionId: string;
}

export class PauseSubscriptionResponseDto {
  @ApiProperty({
    description: 'Confirmation message',
    example: 'Subscription paused successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Subscription ID that was paused',
    example: 'uuid-subscription-id',
  })
  subscriptionId: string;
}

export class ResumeSubscriptionResponseDto {
  @ApiProperty({
    description: 'Confirmation message',
    example: 'Subscription resumed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Subscription ID that was resumed',
    example: 'uuid-subscription-id',
  })
  subscriptionId: string;
}