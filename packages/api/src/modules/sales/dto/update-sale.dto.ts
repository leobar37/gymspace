import { IsString, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class UpdateSaleDto {
  @ApiProperty({ 
    example: 'uuid-client-id', 
    description: 'Customer ID from gym clients', 
    required: false 
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer name', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'Updated notes', description: 'Sale notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: ['file-uuid-1', 'file-uuid-2'],
    description: 'Array of file IDs attached to this sale',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];

  @ApiProperty({
    example: 'paid',
    enum: PaymentStatus,
    description: 'Payment status',
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
