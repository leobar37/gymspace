import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class SearchSalesDto {
  @ApiProperty({ example: 'John', description: 'Search by customer name', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ 
    example: 'paid', 
    enum: PaymentStatus, 
    description: 'Filter by payment status',
    required: false 
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ example: '2024-01-01', description: 'Start date filter (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31', description: 'End date filter (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 10, description: 'Minimum total amount filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minTotal?: number;

  @ApiProperty({ example: 1000, description: 'Maximum total amount filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxTotal?: number;

  @ApiProperty({ example: 1, description: 'Page number', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, description: 'Items per page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 'saleDate', description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ example: 'desc', description: 'Sort direction', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}