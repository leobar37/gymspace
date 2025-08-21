import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductStatus, ProductType } from '@prisma/client';

export class SearchProductsDto {
  @ApiProperty({
    example: 'protein',
    description: 'Search term for product name or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'uuid-category-id',
    description: 'Filter by category ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    example: 'Product',
    enum: ProductType,
    description: 'Filter by product type (Product or Service)',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiProperty({
    example: 'active',
    enum: ProductStatus,
    description: 'Filter by product status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ example: true, description: 'Only show products with stock > 0', required: false })
  @IsOptional()
  @Type(() => Boolean)
  inStock?: boolean;

  @ApiProperty({ example: 10, description: 'Minimum price filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiProperty({ example: 100, description: 'Maximum price filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

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

  @ApiProperty({ example: 'name', description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ example: 'asc', description: 'Sort direction', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
