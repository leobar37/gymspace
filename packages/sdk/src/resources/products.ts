import { BaseResource } from './base';
import { 
  Product,
  ProductCategory,
  StockMovement,
  CreateProductDto, 
  CreateServiceDto,
  UpdateProductDto,
  UpdateStockDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  SearchProductsParams
} from '../models/products';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class ProductsResource extends BaseResource {
  private basePath = 'products';

  // Product Category Methods
  async createCategory(
    data: CreateProductCategoryDto, 
    options?: RequestOptions
  ): Promise<ProductCategory> {
    return this.client.post<ProductCategory>(`${this.basePath}/categories`, data, options);
  }

  async getCategories(options?: RequestOptions): Promise<ProductCategory[]> {
    return this.client.get<ProductCategory[]>(`${this.basePath}/categories`, undefined, options);
  }

  async updateCategory(
    id: string,
    data: UpdateProductCategoryDto,
    options?: RequestOptions
  ): Promise<ProductCategory> {
    return this.client.put<ProductCategory>(`${this.basePath}/categories/${id}`, data, options);
  }

  async deleteCategory(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/categories/${id}`, options);
  }

  // Product Methods
  async createProduct(data: CreateProductDto, options?: RequestOptions): Promise<Product> {
    return this.client.post<Product>(this.basePath, data, options);
  }

  async createService(data: CreateServiceDto, options?: RequestOptions): Promise<Product> {
    return this.client.post<Product>(`${this.basePath}/services`, data, options);
  }

  async searchProducts(
    params?: SearchProductsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Product>> {
    return this.paginate<Product>(this.basePath, params, options);
  }

  async getProduct(id: string, options?: RequestOptions): Promise<Product> {
    return this.client.get<Product>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateProduct(
    id: string,
    data: UpdateProductDto,
    options?: RequestOptions
  ): Promise<Product> {
    return this.client.put<Product>(`${this.basePath}/${id}`, data, options);
  }

  async deleteProduct(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async toggleProductStatus(id: string, options?: RequestOptions): Promise<Product> {
    return this.client.patch<Product>(`${this.basePath}/${id}/toggle-status`, undefined, options);
  }

  async updateStock(
    id: string,
    data: UpdateStockDto,
    options?: RequestOptions
  ): Promise<Product> {
    return this.client.patch<Product>(`${this.basePath}/${id}/stock`, data, options);
  }

  async getLowStockProducts(
    threshold: number = 10,
    options?: RequestOptions
  ): Promise<Product[]> {
    return this.client.get<Product[]>(
      `${this.basePath}/low-stock`,
      { threshold },
      options
    );
  }

  async getProductStockMovements(
    id: string,
    options?: RequestOptions
  ): Promise<StockMovement[]> {
    return this.client.get<StockMovement[]>(`${this.basePath}/${id}/stock-movements`, undefined, options);
  }
}