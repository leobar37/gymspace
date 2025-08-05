import { PaginationMeta } from "@gymspace/shared";
import { ApiProperty } from '@nestjs/swagger';

export class PaginationQueryDto  {
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

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: PaginationMeta;

  constructor(data: T[], meta: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }
}
