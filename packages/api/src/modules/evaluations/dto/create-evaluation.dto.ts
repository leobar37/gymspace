import { IsUUID, IsNumber, IsOptional, IsObject, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvaluationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  gymClientId: string;

  @ApiProperty({ example: 75.5, description: 'Weight in kg' })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({ example: 175, description: 'Height in cm' })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ example: 25, description: 'Body fat percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPercentage?: number;

  @ApiProperty({ example: 40, description: 'Muscle mass percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  muscleMassPercentage?: number;

  @ApiProperty({
    example: {
      chest: 100,
      waist: 85,
      hips: 95,
      leftArm: 30,
      rightArm: 30,
      leftThigh: 55,
      rightThigh: 55,
    },
    description: 'Body measurements in cm',
    required: false,
  })
  @IsOptional()
  @IsObject()
  measurements?: Record<string, number>;

  @ApiProperty({
    example: {
      bloodPressure: '120/80',
      restingHeartRate: 65,
      vo2Max: 45,
    },
    description: 'Health metrics',
    required: false,
  })
  @IsOptional()
  @IsObject()
  healthMetrics?: Record<string, any>;

  @ApiProperty({
    example: {
      benchPress: 80,
      squat: 100,
      deadlift: 120,
    },
    description: 'Performance metrics in kg',
    required: false,
  })
  @IsOptional()
  @IsObject()
  performanceMetrics?: Record<string, number>;

  @ApiProperty({ example: 'Client has improved significantly', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Build muscle mass and reduce body fat', required: false })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiProperty({
    example: 'Increase protein intake and maintain training frequency',
    required: false,
  })
  @IsOptional()
  @IsString()
  recommendations?: string;
}
