import { IsOptional, IsNumber, IsBoolean, IsString, IsArray, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewContractDto {
  @ApiProperty({ example: '2024-02-01', description: 'New start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Payment method ID for renewal (uses existing if not provided)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiProperty({ example: 0, description: 'Discount percentage for renewal', required: false })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiProperty({ example: 49.99, description: 'Custom price for renewal', required: false })
  @IsOptional()
  @IsNumber()
  customPrice?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Apply renewal at the end of current contract', 
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  applyAtEndOfContract?: boolean;

  @ApiProperty({ 
    example: 'Special discount notes', 
    description: 'Notes for the renewal contract', 
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    example: 'doc-123', 
    description: 'Contract document ID', 
    required: false 
  })
  @IsOptional()
  @IsString()
  contractDocumentId?: string;

  @ApiProperty({ 
    example: ['receipt-1', 'receipt-2'], 
    description: 'Receipt IDs for the renewal', 
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  receiptIds?: string[];
}
