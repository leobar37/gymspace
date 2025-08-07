import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchSuppliersDto {
  @ApiProperty({ example: 'acme', description: 'Search term for supplier name, email, or contact info', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 1, description: 'Page number', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, description: 'Items per page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 'name', description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ example: 'asc', description: 'Sort direction', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}