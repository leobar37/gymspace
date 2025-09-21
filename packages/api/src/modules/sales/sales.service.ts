import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { IRequestContext } from '@gymspace/shared';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SearchSalesDto,
  UpdatePaymentStatusDto,
  PaySaleDto,
} from './dto';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions';
import { Prisma, PaymentStatus } from '@prisma/client';

// Helper Services
import { SaleNumberService } from './helpers/sale-number.service';
import { SaleValidationService } from './helpers/sale-validation.service';
import { StockManagementService } from './helpers/stock-management.service';
import { SaleStatisticsService } from './helpers/sale-statistics.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly saleNumberService: SaleNumberService,
    private readonly saleValidationService: SaleValidationService,
    private readonly stockManagementService: StockManagementService,
    private readonly saleStatisticsService: SaleStatisticsService,
  ) {}

  async createSale(context: IRequestContext, dto: CreateSaleDto) {
    const gymId = context.getGymId()!;
    const userId = context.getUserId();

    await this.saleValidationService.validatePaymentMethod(
      context,
      dto.paymentMethodId,
    );

    const products = await this.saleValidationService.validateSaleItems(
      context,
      dto.items,
    );

    const saleNumber = await this.saleNumberService.generateSaleNumber(context);

    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

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

      // Create sale items
      for (const item of dto.items) {
        const itemTotal = item.quantity * item.unitPrice;

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
      }

      // Update stock using helper service
      await this.stockManagementService.updateStockForSaleItems(
        context,
        dto.items,
        products,
        tx,
        'decrement',
      );

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

  async updateSale(
    context: IRequestContext,
    saleId: string,
    dto: UpdateSaleDto,
  ) {
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

    // Validate payment method if provided
    if (dto.paymentMethodId) {
      await this.saleValidationService.validatePaymentMethod(
        context,
        dto.paymentMethodId,
      );
    }

    // If customerId is being updated, get the customer name
    let updateData: any = { ...dto };
    if (dto.customerId && dto.customerId !== sale.customerId) {
      const customer = await this.saleValidationService.validateCustomer(
        context,
        dto.customerId,
      );

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

  async getSale(context: IRequestContext, saleId: string) {
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

  async searchSales(context: IRequestContext, dto: SearchSalesDto) {
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
    orderBy[sortBy as keyof Prisma.SaleOrderByWithRelationInput] =
      sortOrder as Prisma.SortOrder;

    const { skip, take } = this.paginationService.createPaginationParams({
      page,
      limit,
    });

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

  async updatePaymentStatus(
    context: IRequestContext,
    saleId: string,
    dto: UpdatePaymentStatusDto,
  ) {
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

  async paySale(
    context: IRequestContext,
    saleId: string,
    dto: PaySaleDto,
  ) {
    const gymId = context.getGymId()!;
    const userId = context.getUserId();

    // Find the sale
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

    // Check if already paid
    if (sale.paymentStatus === PaymentStatus.paid) {
      throw new BusinessException('Sale is already paid');
    }

    // Validate payment method
    await this.saleValidationService.validatePaymentMethod(
      context,
      dto.paymentMethodId,
    );

    // Update sale with payment information
    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        paymentStatus: PaymentStatus.paid,
        paymentMethodId: dto.paymentMethodId,
        notes: dto.notes || sale.notes,
        fileIds: dto.fileIds || sale.fileIds,
        updatedByUserId: userId,
        paidAt: new Date(),
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

  async deleteSale(context: IRequestContext, saleId: string) {
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

    // Restore stock and soft delete in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Restore stock using helper service
      await this.stockManagementService.restoreStockForDeletedSale(
        context,
        saleId,
        tx,
      );

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

  // Delegate statistics methods to helper service
  async getSalesStats(
    context: IRequestContext,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.saleStatisticsService.getSalesStats(
      context,
      startDate,
      endDate,
    );
  }

  async getTopSellingProducts(
    context: IRequestContext,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.saleStatisticsService.getTopSellingProducts(
      context,
      limit,
      startDate,
      endDate,
    );
  }

  async getSalesByCustomer(
    context: IRequestContext,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.saleStatisticsService.getSalesByCustomer(
      context,
      startDate,
      endDate,
    );
  }
}