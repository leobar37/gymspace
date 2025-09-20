import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IRequestContext } from '@gymspace/shared';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class SaleStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesStats(
    context: IRequestContext,
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

    const [totalSales, totalRevenue, paidSales, unpaidSales] =
      await Promise.all([
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
    context: IRequestContext,
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

  async getSalesByCustomer(
    context: IRequestContext,
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
        totalRevenue: sales.reduce(
          (sum, sale) => sum + parseFloat(sale.total.toString()),
          0,
        ),
      },
      customers: result,
    };
  }

  async getDailySalesReport(
    context: IRequestContext,
    date: Date = new Date(),
  ) {
    const gymId = context.getGymId()!;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Prisma.SaleWhereInput = {
      gymId,
      deletedAt: null,
      saleDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    const [sales, totalRevenue, productsSold] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
            },
          },
          paymentMethod: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
      }),
      this.prisma.sale.aggregate({
        where,
        _sum: { total: true },
      }),
      this.prisma.saleItem.aggregate({
        where: {
          sale: where,
        },
        _sum: { quantity: true },
      }),
    ]);

    return {
      date,
      totalSales: sales.length,
      totalRevenue: totalRevenue._sum.total || 0,
      totalProductsSold: productsSold._sum.quantity || 0,
      sales: sales.map((sale) => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        customerName:
          sale.customer?.name || sale.customerName || 'Walk-in Customer',
        total: sale.total,
        paymentStatus: sale.paymentStatus,
        paymentMethod: sale.paymentMethod?.name || 'N/A',
        itemCount: sale.saleItems.length,
        items: sale.saleItems.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      })),
    };
  }

  async getPaymentMethodStats(
    context: IRequestContext,
    startDate?: Date,
    endDate?: Date,
  ) {
    const gymId = context.getGymId()!;
    const where: Prisma.SaleWhereInput = {
      gymId,
      deletedAt: null,
      paymentStatus: PaymentStatus.paid,
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

    const salesByPaymentMethod = await this.prisma.sale.groupBy({
      by: ['paymentMethodId'],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
    });

    // Get payment method details
    const paymentMethodIds = salesByPaymentMethod
      .map((item) => item.paymentMethodId)
      .filter((id) => id !== null) as string[];

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        id: { in: paymentMethodIds },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return salesByPaymentMethod.map((stat) => {
      const paymentMethod = paymentMethods.find(
        (pm) => pm.id === stat.paymentMethodId,
      );
      return {
        paymentMethod: paymentMethod || { name: 'Cash', code: 'CASH' },
        totalSales: stat._count._all,
        totalRevenue: stat._sum.total || 0,
      };
    });
  }
}