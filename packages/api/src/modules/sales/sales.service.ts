import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { RequestContext } from '../../common/services/request-context.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SearchSalesDto,
  UpdatePaymentStatusDto,
  SaleItemDto,
} from './dto';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions';
import { Prisma, PaymentStatus, ProductStatus, TrackInventory } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private async generateSaleNumber(context: RequestContext): Promise<string> {
    const gymId = context.getGymId()!;
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

  private async validatePaymentMethod(organizationId: string, paymentMethodId?: string) {
    if (!paymentMethodId) {
      return null; // Payment method is optional
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        organizationId,
        enabled: true,
        deletedAt: null,
      },
    });

    if (!paymentMethod) {
      throw new BusinessException('Payment method not found or not enabled for this organization');
    }

    return paymentMethod;
  }

  private async validateSaleItems(context: RequestContext, items: SaleItemDto[]) {
    const gymId = context.getGymId()!;
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

      // Only validate stock for products that track inventory
      if (product.trackInventory !== TrackInventory.none && product.stock !== null) {
        if (product.stock < item.quantity) {
          validationErrors.push(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
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

  async createSale(context: RequestContext, dto: CreateSaleDto) {
    const gymId = context.getGymId()!;
    const organizationId = context.getOrganizationId()!;
    const userId = context.getUserId();

    // Validate payment method if provided
    await this.validatePaymentMethod(organizationId, dto.paymentMethodId);

    // Validate all products and stock
    const products = await this.validateSaleItems(context, dto.items);

    // Generate unique sale number
    const saleNumber = await this.generateSaleNumber(context);

    // Calculate total
    const total = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Create sale in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          gymId,
          customerId: dto.customerId,
          saleNumber,
          total,
          customerName: dto.customerName,
          notes: dto.notes,
          fileIds: dto.fileIds || [],
          paymentStatus: dto.paymentStatus ?? PaymentStatus.unpaid,
          paymentMethodId: dto.paymentMethodId,
          createdByUserId: userId,
        },
        include: {
          paymentMethod: {
            select: {
              id: true,
              name: true,
              code: true,
              enabled: true,
            },
          },
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
          customer: {
            select: {
              id: true,
              clientNumber: true,
              name: true,
              phone: true,
              email: true,
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

        // Update product stock only if it tracks inventory
        const product = products.find((p) => p.id === item.productId);
        if (product && product.trackInventory !== TrackInventory.none && product.stock !== null) {
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
      }

      // Fetch the complete sale with items
      return await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          paymentMethod: {
            select: {
              id: true,
              name: true,
              code: true,
              enabled: true,
            },
          },
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

  async updateSale(context: RequestContext, saleId: string, dto: UpdateSaleDto) {
    const gymId = context.getGymId()!;
    const organizationId = context.getOrganizationId()!;
    const userId = context.getUserId();
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        gymId,
        deletedAt: null,
      },
    });

    if (!sale) {
      throw new ResourceNotFoundException('Sale not found');
    }

    // Validate payment method if provided
    if (dto.paymentMethodId) {
      await this.validatePaymentMethod(organizationId, dto.paymentMethodId);
    }

    // If customerId is being updated, get the customer name
    let updateData = { ...dto };
    if (dto.customerId && dto.customerId !== sale.customerId) {
      const customer = await this.prisma.gymClient.findFirst({
        where: {
          id: dto.customerId,
          gymId,
          deletedAt: null,
        },
        select: {
          name: true,
        },
      });

      if (customer) {
        updateData.customerName = customer.name;
      }
    }

    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        ...updateData,
        updatedByUserId: userId,
      },
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
            enabled: true,
          },
        },
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
        customer: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
            phone: true,
            email: true,
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

  async getSale(context: RequestContext, saleId: string) {
    const gymId = context.getGymId()!;
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        gymId,
        deletedAt: null,
      },
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
            enabled: true,
          },
        },
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
        customer: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
            phone: true,
            email: true,
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

  async searchSales(context: RequestContext, dto: SearchSalesDto) {
    const gymId = context.getGymId()!;
    const {
      customerName,
      customerId,
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

    if (customerId) {
      where.customerId = customerId;
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

  async updatePaymentStatus(context: RequestContext, saleId: string, dto: UpdatePaymentStatusDto) {
    const gymId = context.getGymId()!;
    const userId = context.getUserId();
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        gymId,
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
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
            enabled: true,
          },
        },
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
        customer: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteSale(context: RequestContext, saleId: string) {
    const gymId = context.getGymId()!;
    const userId = context.getUserId();
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        gymId,
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
      // Get products to check if they track inventory
      const productIds = sale.saleItems.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, trackInventory: true, stock: true },
      });

      // Restore stock for each item that tracks inventory
      for (const item of sale.saleItems) {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.trackInventory !== TrackInventory.none && product.stock !== null) {
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

  async getSalesStats(context: RequestContext, startDate?: Date, endDate?: Date) {
    const gymId = context.getGymId()!;
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

  async getTopSellingProducts(
    context: RequestContext,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const gymId = context.getGymId()!;
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

  async getSalesByCustomer(context: RequestContext, startDate?: Date, endDate?: Date) {
    const gymId = context.getGymId()!;
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

    // Get sales grouped by customer (both registered customers and walk-in customers)
    const sales = await this.prisma.sale.findMany({
      where,
      select: {
        id: true,
        total: true,
        saleDate: true,
        customerId: true,
        customerName: true,
        customer: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    // Group sales by customer
    const customerSalesMap = new Map<
      string,
      {
        customer: {
          id: string | null;
          clientNumber?: string;
          name: string;
          phone?: string;
          email?: string;
        };
        totalSales: number;
        totalRevenue: number;
        sales: Array<{
          id: string;
          total: number;
          saleDate: Date;
        }>;
      }
    >();

    sales.forEach((sale) => {
      const customerKey = sale.customerId || `walk-in-${sale.customerName}`;
      const customerData = {
        id: sale.customerId,
        clientNumber: sale.customer?.clientNumber,
        name: sale.customer?.name || sale.customerName || 'Walk-in Customer',
        phone: sale.customer?.phone,
        email: sale.customer?.email,
      };

      if (!customerSalesMap.has(customerKey)) {
        customerSalesMap.set(customerKey, {
          customer: customerData,
          totalSales: 0,
          totalRevenue: 0,
          sales: [],
        });
      }

      const customerSales = customerSalesMap.get(customerKey)!;
      customerSales.totalSales += 1;
      customerSales.totalRevenue += parseFloat(sale.total.toString());
      customerSales.sales.push({
        id: sale.id,
        total: parseFloat(sale.total.toString()),
        saleDate: sale.saleDate,
      });
    });

    // Convert map to array and sort by total revenue
    const result = Array.from(customerSalesMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );

    return {
      summary: {
        totalCustomers: result.length,
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0),
      },
      customers: result,
    };
  }
}
