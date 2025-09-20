import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IRequestContext, UUID } from '@gymspace/shared';
import { TrackInventory, Product } from '@prisma/client';
import { SaleItemDto } from '../dto';

@Injectable()
export class StockManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async updateStockForSaleItems(
    context: IRequestContext,
    items: SaleItemDto[],
    products: Product[],
    tx: any,
    operation: 'decrement' | 'increment' = 'decrement',
  ): Promise<void> {
    const userId = context.getUserId();

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      // Only update stock if product tracks inventory
      if (
        product &&
        product.trackInventory !== TrackInventory.none &&
        product.stock !== null
      ) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              [operation]: item.quantity,
            },
            updatedByUserId: userId,
          },
        });
      }
    }
  }

  async restoreStockForDeletedSale(
    context: IRequestContext,
    saleId: string,
    tx: any,
  ): Promise<void> {
    const userId = context.getUserId();
    const gymId = context.getGymId()!;

    // Get sale items
    const saleItems = await tx.saleItem.findMany({
      where: {
        saleId,
        sale: {
          gymId,
        },
      },
    });

    // Get products to check if they track inventory
    const productIds = saleItems.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, trackInventory: true, stock: true },
    });

    // Restore stock for each item that tracks inventory
    for (const item of saleItems) {
      const product = products.find((p) => p.id === item.productId);
      if (
        product &&
        product.trackInventory !== TrackInventory.none &&
        product.stock !== null
      ) {
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
  }

  async checkStockAvailability(
    context: IRequestContext,
    productId: UUID,
    requestedQuantity: number,
  ): Promise<{ available: boolean; currentStock: number | null }> {
    const gymId = context.getGymId()!;

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        gymId,
        deletedAt: null,
      },
      select: {
        stock: true,
        trackInventory: true,
      },
    });

    if (!product) {
      return { available: false, currentStock: null };
    }

    // If product doesn't track inventory, always available
    if (product.trackInventory === TrackInventory.none) {
      return { available: true, currentStock: null };
    }

    // Check stock availability
    const available =
      product.stock !== null && product.stock >= requestedQuantity;

    return {
      available,
      currentStock: product.stock,
    };
  }

  async getLowStockProducts(
    context: IRequestContext,
    threshold: number = 10,
  ): Promise<Product[]> {
    const gymId = context.getGymId()!;

    return await this.prisma.product.findMany({
      where: {
        gymId,
        deletedAt: null,
        trackInventory: {
          not: TrackInventory.none,
        },
        stock: {
          lte: threshold,
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }
}