import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus } from '@prisma/client';
import { PaginationQueryDto, DateRangeQueryDto } from 'src/common/dto';

export class GetContractsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ContractStatus,
    description: 'Filter by contract status',
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: 'Filter by client name',
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({
    description: 'Filter by client ID',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Start date for the contract start date range (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for the contract start date range (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  startDateTo?: string;

  @ApiPropertyOptional({
    description: 'Start date for the contract end date range (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  endDateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for the contract end date range (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  endDateTo?: string;
}