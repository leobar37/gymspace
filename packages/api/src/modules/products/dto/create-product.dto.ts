import { IsString, IsOptional, IsNumber, Min, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Protein Powder', description: 'Product name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'High-quality whey protein powder for muscle building', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99, description: 'Product price' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 100, description: 'Initial stock quantity', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'uuid-category-id', description: 'Product category ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 'uuid-asset-id', description: 'Product image asset ID', required: false })
  @IsOptional()
  @IsString()
  imageId?: string;

  @ApiProperty({
    example: 'active',
    enum: ProductStatus,
    description: 'Product status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
