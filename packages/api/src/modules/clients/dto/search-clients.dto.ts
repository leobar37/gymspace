import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ default: 1, minimum: 1, description: 'Page number' })
  page: number = 1;

  @ApiProperty({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  limit: number = 20;

  @ApiProperty({ required: false, description: 'Field to sort by' })
  sortBy?: string;

  @ApiProperty({
    required: false,
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort order',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SearchClientsDto extends PartialType(PaginationQueryDto) {
  @ApiProperty({ example: 'john', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean;
}
