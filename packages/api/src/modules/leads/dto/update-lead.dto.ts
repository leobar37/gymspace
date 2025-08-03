import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@gymspace/shared';

export class UpdateLeadDto {
  @ApiProperty({ enum: LeadStatus, example: LeadStatus.CONTACTED, required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ example: 'Follow up scheduled for next week', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiProperty({
    example: {
      lastContactDate: '2024-01-15',
      nextFollowUp: '2024-01-22',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
