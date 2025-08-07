import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckInDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the gym client checking in'
  })
  @IsUUID()
  gymClientId: string;

  @ApiProperty({ example: 'Client feeling good today', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
