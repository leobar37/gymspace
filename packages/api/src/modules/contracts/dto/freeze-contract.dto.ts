import { IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FreezeContractDto {
  @ApiProperty({ example: '2024-01-15', description: 'Freeze start date' })
  @IsDateString()
  freezeStartDate: string;

  @ApiProperty({ example: '2024-01-30', description: 'Freeze end date' })
  @IsDateString()
  freezeEndDate: string;

  @ApiProperty({ example: 'Medical reasons', description: 'Reason for freezing', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
