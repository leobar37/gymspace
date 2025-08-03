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
  price: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 1, description: 'Duration in months' })
  @IsNumber()
  @Min(1)
  durationMonths: number;

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
}
