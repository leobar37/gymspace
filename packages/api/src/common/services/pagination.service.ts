import { Injectable } from '@nestjs/common';
import {
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  PAGINATION_DEFAULTS,
} from '@gymspace/shared';

export interface PaginationOptions<T> {
  page?: number;
  limit?: number;
  sortBy?: keyof T | string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginateResult<T> {
  data: T[];
  meta: PaginationMeta;
}

@Injectable()
export class PaginationService {
  /**
   * Create pagination parameters for database queries
   */
  createPaginationParams<T>(options: PaginationOptions<T>): {
    skip: number;
    take: number;
    orderBy?: any;
  } {
    const page = Math.max(1, options.page || PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      options.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy = options.sortBy
      ? { [options.sortBy as string]: options.sortOrder || 'desc' }
      : undefined;

    return { skip, take, orderBy };
  }

  /**
   * Create paginated response with metadata
   */
  paginate<T>(data: T[], total: number, options: PaginationOptions<T>): PaginatedResponse<T> {
    const page = Math.max(1, options.page || PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      options.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return { data, meta };
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(params: PaginationParams): PaginationParams {
    return {
      page: Math.max(1, params.page || PAGINATION_DEFAULTS.PAGE),
      limit: Math.min(
        Math.max(1, params.limit || PAGINATION_DEFAULTS.LIMIT),
        PAGINATION_DEFAULTS.MAX_LIMIT,
      ),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'desc',
    };
  }

  /**
   * Create pagination links for API responses
   */
  createPaginationLinks(baseUrl: string, meta: PaginationMeta): Record<string, string | null> {
    const links: Record<string, string | null> = {
      first: `${baseUrl}?page=1&limit=${meta.limit}`,
      last: `${baseUrl}?page=${meta.totalPages}&limit=${meta.limit}`,
      prev: null,
      next: null,
    };

    if (meta.hasPrevious) {
      links.prev = `${baseUrl}?page=${meta.page - 1}&limit=${meta.limit}`;
    }

    if (meta.hasNext) {
      links.next = `${baseUrl}?page=${meta.page + 1}&limit=${meta.limit}`;
    }

    return links;
  }
}
