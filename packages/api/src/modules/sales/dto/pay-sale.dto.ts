import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';

export class PaySaleDto {
  @ApiProperty({
    description: 'The payment method ID to use for this sale',
    example: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the payment',
    example: 'Payment received via bank transfer',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Array of file IDs for payment receipts or documents',
    example: ['file-uuid-1', 'file-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}