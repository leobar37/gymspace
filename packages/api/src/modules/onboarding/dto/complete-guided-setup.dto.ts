import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteGuidedSetupDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Gym ID to complete setup for' })
  @IsNotEmpty()
  @IsUUID()
  gymId: string;
}