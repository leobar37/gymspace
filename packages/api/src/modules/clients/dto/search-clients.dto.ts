import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchClientsDto {
  @ApiProperty({ example: 'john', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}
