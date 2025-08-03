import { IsOptional, IsNumber, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewContractDto {
  @ApiProperty({ example: '2024-02-01', description: 'New start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: 0, description: 'Discount percentage for renewal', required: false })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiProperty({ example: 49.99, description: 'Custom price for renewal', required: false })
  @IsOptional()
  @IsNumber()
  customPrice?: number;

  @ApiProperty({
    example: {
      renewalReason: 'loyalty',
      notes: 'Renewal with loyalty discount',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
