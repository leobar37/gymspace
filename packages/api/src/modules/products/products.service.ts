import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import {
  CreateProductDto,
  CreateServiceDto,
  UpdateProductDto,
  SearchProductsDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  UpdateStockDto,
} from './dto';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions';
import { Prisma, ProductStatus, ProductType, TrackInventory, StockMovementType } from '@prisma/client';
import { RequestContext } from '../../common/services/request-context.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  // Product Categories Methods
  async createCategory(ctx: RequestContext, dto: CreateProductCategoryDto) {
    const gymId = ctx.getGymId()!;
    const userId = ctx.getUserId()!;

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

  async updateCategory(ctx: RequestContext, categoryId: string, dto: UpdateProductCategoryDto) {
    const userId = ctx.getUserId()!;

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

  async deleteCategory(ctx: RequestContext, categoryId: string) {
    const userId = ctx.getUserId()!;

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

  async getCategories(ctx: RequestContext) {
    const gymId = ctx.getGymId()!;

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
  async createProduct(ctx: RequestContext, dto: CreateProductDto) {
    const gymId = ctx.getGymId()!;
    const userId = ctx.getUserId()!;

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

    // Filter out any unknown fields from DTO
    const { name, description, price, stock, categoryId, imageId, status } = dto;

    return this.prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: stock ?? 0,
        categoryId,
        imageId,
        status: status ?? ProductStatus.active,
        gymId,
        createdByUserId: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async createService(ctx: RequestContext, dto: CreateServiceDto) {
    const gymId = ctx.getGymId()!;
    const userId = ctx.getUserId()!;

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

    // Check for duplicate service name within gym
    const existingService = await this.prisma.product.findFirst({
      where: {
        gymId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingService) {
      throw new BusinessException('Service with this name already exists');
    }

    // Filter out any unknown fields from DTO
    const { name, description, price, categoryId, imageId } = dto;

    return this.prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: null, // Services don't have stock
        categoryId,
        imageId,
        status: ProductStatus.active,
        type: ProductType.Service,
        trackInventory: TrackInventory.none,
        gymId,
        createdByUserId: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async updateProduct(ctx: RequestContext, productId: string, dto: UpdateProductDto) {
    const userId = ctx.getUserId()!;

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

    // Filter out any unknown fields from DTO
    const { name, description, price, stock, categoryId, imageId, status } = dto;
    const updateData: any = { updatedByUserId: userId };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (imageId !== undefined) updateData.imageId = imageId;
    if (status !== undefined) updateData.status = status;

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(ctx: RequestContext, productId: string) {
    const userId = ctx.getUserId()!;

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

  async getProduct(_ctx: RequestContext, productId: string) {
    // Context is passed for consistency but not currently used
    // Could be used in the future for gym-specific validation
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

  async searchProducts(ctx: RequestContext, dto: SearchProductsDto) {
    const gymId = ctx.getGymId()!;

    const {
      search,
      categoryId,
      type,
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

    if (type) {
      where.type = type;
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

    const { skip, take } = this.paginationService.createPaginationParams({ page, limit });

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

    return this.paginationService.paginate(products, total, { page, limit });
  }

  async toggleProductStatus(ctx: RequestContext, productId: string) {
    const userId = ctx.getUserId()!;

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    const newStatus =
      product.status === ProductStatus.active ? ProductStatus.inactive : ProductStatus.active;

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

  async updateStock(ctx: RequestContext, productId: string, dto: UpdateStockDto) {
    const userId = ctx.getUserId()!;
    const gymId = ctx.getGymId()!;

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new ResourceNotFoundException('Product not found');
    }

    // Only track stock movements if the product has inventory tracking enabled
    const shouldTrackMovement = product.trackInventory !== TrackInventory.none;

    if (shouldTrackMovement) {
      // Use transaction to ensure consistency
      return this.prisma.$transaction(async (tx) => {
        const previousStock = product.stock || 0;
        const newStock = dto.quantity;

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stock: newStock,
            updatedByUserId: userId,
          },
          include: {
            category: true,
          },
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId,
            gymId,
            type: StockMovementType.manual_entry,
            quantity: newStock - previousStock,
            previousStock,
            newStock,
            notes: dto.notes,
            supplierId: dto.supplierId,
            fileId: dto.fileId,
            createdByUserId: userId,
          },
        });

        return updatedProduct;
      });
    } else {
      // Simple stock update without movement tracking
      return this.prisma.product.update({
        where: { id: productId },
        data: {
          stock: dto.quantity,
          updatedByUserId: userId,
        },
        include: {
          category: true,
        },
      });
    }
  }

  async getLowStockProducts(ctx: RequestContext, threshold: number = 10) {
    const gymId = ctx.getGymId()!;

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
