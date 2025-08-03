// DTOs
export * from './auth';
export * from './organizations';
export * from './gyms';
export * from './clients';
export * from './membership-plans';
export * from './contracts';
export * from './evaluations';
export * from './check-ins';
export * from './invitations';
export * from './leads';
export * from './assets';

// Common types
export interface PaginationQueryDto {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: any;
}