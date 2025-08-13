import { IsUUID, IsDateString, IsOptional, IsNumber, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  gymClientId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  gymMembershipPlanId: string;

  @ApiProperty({ example: '2024-01-01', description: 'Contract start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: 0, description: 'Discount percentage (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiProperty({ example: 49.99, description: 'Custom price override', required: false })
  @IsOptional()
  @IsNumber()
  customPrice?: number;

  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174002'], 
    description: 'Array of asset IDs for contract receipts',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  receiptIds?: string[];

  @ApiProperty({
    example: {
      paymentMethod: 'credit_card',
      referredBy: 'John Doe',
      notes: 'Special promotion',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
