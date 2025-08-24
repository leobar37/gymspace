import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ default: 1, minimum: 1, description: 'Page number' })
  page: number = 1;

  @ApiProperty({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  limit: number = 20;

  @ApiProperty({ required: false, description: 'Field to sort by' })
  sortBy?: string;

  @ApiProperty({
    required: false,
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort order',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SearchPaymentMethodDto extends PartialType(PaginationQueryDto) {
  @ApiProperty({
    example: 'efectivo',
    required: false,
    description: 'Search by name, description or code',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ obj, key }) => {
    const value = obj[key];
    return value === 'true' || value === true;
  })
  @IsBoolean()
  enabledOnly?: boolean;

  @ApiProperty({
    example: 'CASH_001',
    required: false,
    description: 'Search by exact payment method code',
  })
  @IsOptional()
  @IsString()
  code?: string;
}