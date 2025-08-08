import { BaseResource } from './base';
import { RequestOptions, PaginatedResponseDto } from '../types';
import { PaginationQueryDto } from '../types';

export interface SearchCatalogParams extends PaginationQueryDto {
  search?: string;
  city?: string;
  state?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
}

export interface GetFeaturedGymsParams {
  limit: string;
}

export interface CatalogGym {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  amenities?: any;
  settings?: any;
}

export interface CityWithGyms {
  city: string;
  state: string;
  count: number;
}

export class PublicCatalogResource extends BaseResource {
  private basePath = 'catalog';

  async searchCatalog(
    params?: SearchCatalogParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<CatalogGym>> {
    return this.paginate<CatalogGym>(`${this.basePath}/search`, params, options);
  }

  async getFeaturedGyms(
    params: GetFeaturedGymsParams,
    options?: RequestOptions
  ): Promise<CatalogGym[]> {
    return this.client.get<CatalogGym[]>(`${this.basePath}/featured`, params, options);
  }

  async getCitiesWithGyms(options?: RequestOptions): Promise<CityWithGyms[]> {
    return this.client.get<CityWithGyms[]>(`${this.basePath}/cities`, undefined, options);
  }

  async getGymBySlug(slug: string, options?: RequestOptions): Promise<CatalogGym> {
    return this.client.get<CatalogGym>(`${this.basePath}/${slug}`, undefined, options);
  }
}