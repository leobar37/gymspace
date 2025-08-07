import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  SearchProductsDto, 
  CreateProductCategoryDto, 
  UpdateProductCategoryDto 
} from './dto';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions';
import { Prisma, ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  // Product Categories Methods
  async createCategory(gymId: string, dto: CreateProductCategoryDto, userId: string) {
    // Check for duplicate category name within gym
    const existingCategory = await this.prisma.productCategory.findFirst({
      where: {
        gymId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingCategory) {
      throw new BusinessException('Category with this name already exists');
    }

    return this.prisma.productCategory.create({
      data: {
        ...dto,
        gymId,
        createdByUserId: userId,
      },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateProductCategoryDto, userId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new ResourceNotFoundException('Category not found');
    }

    // Check for duplicate name if updating name
    if (dto.name) {
      const existingCategory = await this.prisma.productCategory.findFirst({
        where: {
          gymId: category.gymId,
          name: dto.name,
          id: { not: categoryId },
          deletedAt: null,
        },
      });

      if (existingCategory) {
        throw new BusinessException('Category with this name already exists');
      }
    }

    return this.prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
    });
  }

  async deleteCategory(categoryId: string, userId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!category) {
      throw new ResourceNotFoundException('Category not found');
    }

    if (category._count.products > 0) {
      throw new BusinessException('Cannot delete category that has products assigned');
    }

    return this.prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });
  }

  async getCategories(gymId: string) {
    return this.prisma.productCategory.findMany({
      where: {
        gymId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null, status: ProductStatus.active },
            },
          },
        },
      },
    });
  }

  // Product Methods
  async createProduct(gymId: string, dto: CreateProductDto, userId: string) {
    // Validate category exists if provided
    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: {
          id: dto.categoryId,
          gymId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new ResourceNotFoundException('Category not found');
      }
    }

    // Check for duplicate product name within gym
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        gymId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingProduct) {
      throw new BusinessException('Product with this name already exists');
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        gymId,
        createdByUserId: userId,
        stock: dto.stock ?? 0,
        status: dto.status ?? ProductStatus.active,
      },
      include: {
        category: true,
      },
    });
  }

  async updateProduct(productId: string, dto: UpdateProductDto, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    // Validate category exists if provided
    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: {
          id: dto.categoryId,
          gymId: product.gymId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new ResourceNotFoundException('Category not found');
      }
    }

    // Check for duplicate name if updating name
    if (dto.name) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          gymId: product.gymId,
          name: dto.name,
          id: { not: productId },
          deletedAt: null,
        },
      });

      if (existingProduct) {
        throw new BusinessException('Product with this name already exists');
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(productId: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });
  }

  async getProduct(productId: string, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    return product;
  }

  async searchProducts(gymId: string, dto: SearchProductsDto, userId: string) {
    const {
      search,
      categoryId,
      status,
      inStock,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = dto;

    const where: Prisma.ProductWhereInput = {
      gymId,
      deletedAt: null,
    };

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'category') {
      orderBy.category = { name: sortOrder };
    } else {
      orderBy[sortBy as keyof Prisma.ProductOrderByWithRelationInput] = sortOrder;
    }

    const { skip, take } = this.paginationService.getSkipTake(page, limit);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          _count: {
            select: {
              saleItems: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.paginationService.paginate({
      data: products,
      total,
      page,
      limit,
    });
  }

  async toggleProductStatus(productId: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    const newStatus = product.status === ProductStatus.active 
      ? ProductStatus.inactive 
      : ProductStatus.active;

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        status: newStatus,
        updatedByUserId: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async updateStock(productId: string, quantity: number, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    const newStock = Math.max(0, product.stock + quantity);

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        updatedByUserId: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async getLowStockProducts(gymId: string, threshold: number = 10) {
    return this.prisma.product.findMany({
      where: {
        gymId,
        deletedAt: null,
        status: ProductStatus.active,
        stock: { lte: threshold },
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }
}