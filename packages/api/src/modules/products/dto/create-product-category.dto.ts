import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Supplements', description: 'Category name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Nutritional supplements and vitamins', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '#FF5733', description: 'Category color in hex format', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
