import { IsString, IsOptional, IsBoolean, IsObject, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Efectivo' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Pagos en efectivo para membresías y productos', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'CASH_001', description: 'Unique code for the payment method' })
  @IsString()
  @MinLength(3)
  code: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether the payment method is enabled',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;

  @ApiProperty({
    example: {
      processingFee: 0.03,
      provider: 'stripe',
      accountId: 'acct_123456789',
    },
    required: false,
    description: 'Additional metadata for the payment method',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
