import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../common/exceptions';
import { IRequestContext } from '@gymspace/shared';
import { ProductStatus, TrackInventory, Product } from '@prisma/client';
import { SaleItemDto } from '../dto';

@Injectable()
export class SaleValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validatePaymentMethod(
    context: IRequestContext,
    paymentMethodId?: string,
  ) {
    if (!paymentMethodId) {
      return null; // Payment method is optional
    }

    const organizationId = context.getOrganizationId()!;
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        organizationId,
        enabled: true,
        deletedAt: null,
      },
    });

    if (!paymentMethod) {
      throw new BusinessException(
        'Payment method not found or not enabled for this organization',
      );
    }

    return paymentMethod;
  }

  async validateSaleItems(
    context: IRequestContext,
    items: SaleItemDto[],
  ): Promise<Product[]> {
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
      if (
        product.trackInventory !== TrackInventory.none &&
        product.stock !== null
      ) {
        if (product.stock < item.quantity) {
          validationErrors.push(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
      }

      // Validate unit price matches current product price (with small tolerance for price changes)
      const priceDiff = Math.abs(
        parseFloat(product.price.toString()) - item.unitPrice,
      );
      if (priceDiff > 0.01) {
        validationErrors.push(
          `Price mismatch for ${product.name}. Current: ${product.price}, Provided: ${item.unitPrice}`,
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new BusinessException(
        `Sale validation failed: ${validationErrors.join(', ')}`,
      );
    }

    return products;
  }

  async validateCustomer(
    context: IRequestContext,
    customerId?: string,
  ): Promise<{ name: string } | null> {
    if (!customerId) {
      return null;
    }

    const gymId = context.getGymId()!;
    const customer = await this.prisma.gymClient.findFirst({
      where: {
        id: customerId,
        gymId,
        deletedAt: null,
      },
      select: {
        name: true,
      },
    });

    return customer;
  }
}