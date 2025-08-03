import { PaginationParams, PaginationMeta } from './types';

export class PaginationQueryDto implements PaginationParams {
  page: number = 1;
  limit: number = 20;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], meta: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }
}