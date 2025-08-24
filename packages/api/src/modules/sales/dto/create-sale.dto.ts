import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';
import { SaleItemDto } from './sale-item.dto';

export class CreateSaleDto {
  @ApiProperty({
    type: [SaleItemDto],
    description: 'Array of sale items',
    example: [
      {
        productId: 'uuid-product-id',
        quantity: 2,
        unitPrice: 29.99,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({ example: 'John Doe', description: 'Customer name', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({
    example: 'Customer requested extra packaging',
    description: 'Sale notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'paid',
    enum: PaymentStatus,
    description: 'Payment status',
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    example: 'uuid-payment-method-id',
    description: 'Payment method ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;
}
