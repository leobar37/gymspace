import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'Plan Mensual' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Acceso completo al gimnasio durante un mes', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 1, description: 'Duration in months', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMonths?: number;

  @ApiProperty({ example: 30, description: 'Duration in days', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @ApiProperty({ example: 'Terms and conditions text', required: false })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  allowsCustomPricing?: boolean;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxEvaluations?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  includesAdvisor?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  showInCatalog?: boolean;

  @ApiProperty({
    example: ['Acceso completo', 'Clases grupales', 'Evaluación mensual'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    example: 'active',
    description: 'Plan status',
    required: false,
    enum: ['active', 'inactive', 'archived'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    example: ['asset-id-1', 'asset-id-2'],
    description: 'Array of asset IDs for plan images',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assetsIds?: string[];
}
