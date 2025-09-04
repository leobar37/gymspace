import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the data range (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the data range (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}