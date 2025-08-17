import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    example: 'paid',
    enum: PaymentStatus,
    description: 'New payment status',
  })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
