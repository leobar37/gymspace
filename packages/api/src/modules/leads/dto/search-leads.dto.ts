import { IsOptional, IsEnum, IsString, IsDateString, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@gymspace/shared';

export class SearchLeadsDto {
  @ApiProperty({ enum: LeadStatus, required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ example: 'john', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({ example: '0', required: false })
  @IsOptional()
  @IsNumberString()
  offset?: string;
}
