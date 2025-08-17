import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SearchSalesDto,
  UpdatePaymentStatusDto,
  SaleItemDto,
} from './dto';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions';
import { Prisma, PaymentStatus, ProductStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private async generateSaleNumber(gymId: string): Promise<string> {
    // Generate sale number based on date + sequential number
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Find the highest sale number for today
    const lastSale = await this.prisma.sale.findFirst({
      where: {
        gymId,
        saleNumber: { startsWith: datePrefix },
        deletedAt: null,
      },
      orderBy: {
        saleNumber: 'desc',
      },
    });

    let sequenceNumber = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
      sequenceNumber = lastSequence + 1;
    }

    return `${datePrefix}${sequenceNumber.toString().padStart(4, '0')}`;
  }

  private async validateSaleItems(gymId: string, items: SaleItemDto[]) {
    const productIds = items.map((item) => item.productId);

    // Get all products in one query
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        gymId,
        deletedAt: null,
      },
    });

    if (products.length !== productIds.length) {
      throw new BusinessException('One or more products not found');
    }

    // Validate each item
    const validationErrors: string[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        validationErrors.push(`Product ${item.productId} not found`);
        continue;
      }

      if (product.status !== ProductStatus.active) {
        validationErrors.push(`Product ${product.name} is not active`);
      }

      if (product.stock < item.quantity) {
        validationErrors.push(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      // Validate unit price matches current product price (with small tolerance for price changes)
      const priceDiff = Math.abs(parseFloat(product.price.toString()) - item.unitPrice);
      if (priceDiff > 0.01) {
        validationErrors.push(
          `Price mismatch for ${product.name}. Current: ${product.price}, Provided: ${item.unitPrice}`,
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new BusinessException(`Sale validation failed: ${validationErrors.join(', ')}`);
    }

    return products;
  }

  async createSale(gymId: string, dto: CreateSaleDto, userId: string) {
    // Validate all products and stock
    const products = await this.validateSaleItems(gymId, dto.items);

    // Generate unique sale number
    const saleNumber = await this.generateSaleNumber(gymId);

    // Calculate total
    const total = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Create sale in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          gymId,
          saleNumber,
          total,
          customerName: dto.customerName,
          notes: dto.notes,
          paymentStatus: dto.paymentStatus ?? PaymentStatus.unpaid,
          createdByUserId: userId,
        },
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageId: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Create sale items and update stock
      for (const item of dto.items) {
        const itemTotal = item.quantity * item.unitPrice;

        // Create sale item
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: itemTotal,
            createdByUserId: userId,
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
            updatedByUserId: userId,
          },
        });
      }

      // Fetch the complete sale with items
      return await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageId: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });
  }

  async updateSale(saleId: string, dto: UpdateSaleDto, userId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        deletedAt: null,
      },
    });

    if (!sale) {
      throw new ResourceNotFoundException('Sale not found');
    }

    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageId: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getSale(saleId: string, userId?: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        deletedAt: null,
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageId: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!sale) {
      throw new ResourceNotFoundException('Sale not found');
    }

    return sale;
  }

  async searchSales(gymId: string, dto: SearchSalesDto, userId: string) {
    const {
      customerName,
      paymentStatus,
      startDate,
      endDate,
      minTotal,
      maxTotal,
      page = 1,
      limit = 20,
      sortBy = 'saleDate',
      sortOrder = 'desc',
    } = dto;

    const where: Prisma.SaleWhereInput = {
      gymId,
      deletedAt: null,
    };

    // Apply filters
    if (customerName) {
      where.customerName = { contains: customerName, mode: 'insensitive' };
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.saleDate.lte = endDateTime;
      }
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      where.total = {};
      if (minTotal !== undefined) {
        where.total.gte = minTotal;
      }
      if (maxTotal !== undefined) {
        where.total.lte = maxTotal;
      }
    }

    // Build orderBy
    const orderBy: Prisma.SaleOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.SaleOrderByWithRelationInput] = sortOrder;

    const { skip, take } = this.paginationService.createPaginationParams({ page, limit });

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: {
              saleItems: true,
            },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return this.paginationService.paginate(sales, total, { page, limit });
  }

  async updatePaymentStatus(saleId: string, dto: UpdatePaymentStatusDto, userId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        deletedAt: null,
      },
    });

    if (!sale) {
      throw new ResourceNotFoundException('Sale not found');
    }

    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        paymentStatus: dto.paymentStatus,
        updatedByUserId: userId,
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageId: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteSale(saleId: string, userId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        deletedAt: null,
      },
      include: {
        saleItems: true,
      },
    });

    if (!sale) {
      throw new ResourceNotFoundException('Sale not found');
    }

    // Restore stock for all items in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Restore stock for each item
      for (const item of sale.saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
            updatedByUserId: userId,
          },
        });
      }

      // Soft delete the sale (sale items will be handled by cascade)
      return await tx.sale.update({
        where: { id: saleId },
        data: {
          deletedAt: new Date(),
          updatedByUserId: userId,
        },
      });
    });
  }

  async getSalesStats(gymId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.SaleWhereInput = {
      gymId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = startDate;
      }
      if (endDate) {
        where.saleDate.lte = endDate;
      }
    }

    const [totalSales, totalRevenue, paidSales, unpaidSales] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({
        where,
        _sum: { total: true },
      }),
      this.prisma.sale.count({
        where: { ...where, paymentStatus: PaymentStatus.paid },
      }),
      this.prisma.sale.count({
        where: { ...where, paymentStatus: PaymentStatus.unpaid },
      }),
    ]);

    return {
      totalSales,
      totalRevenue: totalRevenue._sum.total || 0,
      paidSales,
      unpaidSales,
      paymentRate: totalSales > 0 ? (paidSales / totalSales) * 100 : 0,
    };
  }

  async getTopSellingProducts(gymId: string, limit: number = 10, startDate?: Date, endDate?: Date) {
    const where: Prisma.SaleWhereInput = {
      gymId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = startDate;
      }
      if (endDate) {
        where.saleDate.lte = endDate;
      }
    }

    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: where,
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = topProducts.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageId: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.total || 0,
      };
    });
  }
}
