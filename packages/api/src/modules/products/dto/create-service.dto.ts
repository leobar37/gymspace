import { IsString, IsOptional, IsNumber, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Personal Training Session',
    description: 'Service name',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'One-on-one personal training session with a certified trainer',
    description: 'Service description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 50.0,
    description: 'Service price per session',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'uuid-category-id',
    description: 'Service category ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    example: 'uuid-asset-id',
    description: 'Service image asset ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageId?: string;
}
