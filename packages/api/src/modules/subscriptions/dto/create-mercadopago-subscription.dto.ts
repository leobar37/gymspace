import { IsString, IsEmail, IsOptional, ValidateNested, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AutoRecurringDto {
  @ApiProperty({
    description: 'Billing frequency (e.g., 1 for monthly, 3 for quarterly)',
    example: 1,
  })
  @IsNumber()
  frequency: number;

  @ApiProperty({
    description: 'Frequency type',
    enum: ['months', 'days', 'weeks'],
    example: 'months',
  })
  @IsIn(['months', 'days', 'weeks'])
  frequency_type: 'months' | 'days' | 'weeks';

  @ApiProperty({
    description: 'Transaction amount',
    example: 29.99,
  })
  @IsNumber()
  transaction_amount: number;

  @ApiProperty({
    description: 'Currency ID',
    example: 'ARS',
  })
  @IsString()
  currency_id: string;

  @ApiProperty({
    description: 'Number of repetitions (optional for unlimited)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  repetitions?: number;

  @ApiProperty({
    description: 'Billing day of the month (1-28)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  billing_day?: number;
}

export class CreateMercadoPagoSubscriptionDto {
  @ApiProperty({
    description: 'MercadoPago subscription plan ID',
    example: 'MP-PLN-123456789',
  })
  @IsString()
  preapproval_plan_id: string;

  @ApiProperty({
    description: 'Subscription reason/description',
    example: 'Premium Gym Management Plan',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'External reference (our internal subscription plan ID)',
    example: 'uuid-subscription-plan-id',
  })
  @IsString()
  external_reference: string;

  @ApiProperty({
    description: 'Payer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  payer_email: string;

  @ApiProperty({
    description: 'Card token ID for payment method (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  card_token_id?: string;

  @ApiProperty({
    description: 'Auto recurring configuration',
    type: AutoRecurringDto,
  })
  @ValidateNested()
  @Type(() => AutoRecurringDto)
  auto_recurring: AutoRecurringDto;

  @ApiProperty({
    description: 'Back URL after payment',
    example: 'https://yourdomain.com/subscription/success',
  })
  @IsString()
  back_url: string;

  @ApiProperty({
    description: 'Subscription status',
    enum: ['pending', 'authorized', 'paused', 'cancelled'],
    required: false,
    default: 'pending',
  })
  @IsOptional()
  @IsIn(['pending', 'authorized', 'paused', 'cancelled'])
  status?: 'pending' | 'authorized' | 'paused' | 'cancelled';
}