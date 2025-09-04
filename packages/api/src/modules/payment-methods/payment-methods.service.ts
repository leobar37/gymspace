import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, SearchPaymentMethodDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Prisma } from '@prisma/client';
import { RequestContext } from '../../common/services/request-context.service';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private prismaService: PrismaService,
    private paginationService: PaginationService,
  ) {}

  /**
   * Create a new payment method
   */
  async createPaymentMethod(ctx: RequestContext, dto: CreatePaymentMethodDto): Promise<any> {
    const organizationId = ctx.getOrganizationId()!;
    const userId = ctx.getUserId()!;

    // Check if code already exists in this organization
    const existingPaymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: {
        code: dto.code.toUpperCase(),
        organizationId,
        deletedAt: null,
      },
    });

    if (existingPaymentMethod) {
      throw new BusinessException(
        `Ya existe un método de pago con el código ${dto.code} en esta organización`,
      );
    }

    // Create payment method
    const paymentMethod = await this.prismaService.paymentMethod.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        code: dto.code.toUpperCase(),
        enabled: dto.enabled ?? true,
        metadata: dto.metadata || {},
        organizationId,
        createdByUserId: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return paymentMethod;
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    ctx: RequestContext,
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<any> {
    const organizationId = ctx.getOrganizationId()!;
    const userId = ctx.getUserId()!;

    // Verify payment method exists and belongs to the organization
    const paymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!paymentMethod) {
      throw new ResourceNotFoundException('PaymentMethod', paymentMethodId);
    }

    // If code is being updated, check uniqueness within organization
    if (dto.code && dto.code.toUpperCase() !== paymentMethod.code) {
      const codeExists = await this.prismaService.paymentMethod.findFirst({
        where: {
          code: dto.code.toUpperCase(),
          organizationId,
          deletedAt: null,
          id: { not: paymentMethodId },
        },
      });

      if (codeExists) {
        throw new BusinessException(
          `Ya existe un método de pago con el código ${dto.code} en esta organización`,
        );
      }
    }

    // Update payment method
    const updated = await this.prismaService.paymentMethod.update({
      where: { id: paymentMethodId },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        code: dto.code?.toUpperCase(),
        enabled: dto.enabled,
        metadata: dto.metadata,
        updatedByUserId: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethod(ctx: RequestContext, paymentMethodId: string): Promise<any> {
    const organizationId = ctx.getOrganizationId()!;

    const paymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        organizationId,
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!paymentMethod) {
      throw new ResourceNotFoundException('PaymentMethod', paymentMethodId);
    }

    return paymentMethod;
  }

  /**
   * Search payment methods in organization
   */
  async searchPaymentMethods(ctx: RequestContext, dto: SearchPaymentMethodDto) {
    const organizationId = ctx.getOrganizationId()!;

    const where: Prisma.PaymentMethodWhereInput = {
      organizationId,
      deletedAt: null,
    };

    // Apply search filter
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
        { code: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // Apply specific filters
    if (dto.code) {
      where.code = dto.code.toUpperCase();
    }

    // Apply enabled filter
    if (dto.enabledOnly) {
      where.enabled = true;
    }

    // Get total count
    const total = await this.prismaService.paymentMethod.count({ where });

    // Create pagination params
    const paginationParams = this.paginationService.createPaginationParams({
      page: dto.page,
      limit: dto.limit,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    });

    // Get payment methods with pagination
    const paymentMethods = await this.prismaService.paymentMethod.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: paginationParams.orderBy || { createdAt: 'desc' },
      ...paginationParams,
    });

    // Return paginated response
    return this.paginationService.paginate(paymentMethods, total, {
      page: dto.page,
      limit: dto.limit,
    });
  }

  /**
   * Soft delete payment method
   */
  async deletePaymentMethod(ctx: RequestContext, paymentMethodId: string): Promise<any> {
    const organizationId = ctx.getOrganizationId()!;
    const userId = ctx.getUserId()!;

    const paymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!paymentMethod) {
      throw new ResourceNotFoundException('PaymentMethod', paymentMethodId);
    }

    // Soft delete the payment method
    return this.prismaService.paymentMethod.update({
      where: { id: paymentMethodId },
      data: {
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Toggle payment method enabled status
   */
  async togglePaymentMethod(ctx: RequestContext, paymentMethodId: string): Promise<any> {
    const organizationId = ctx.getOrganizationId()!;
    const userId = ctx.getUserId()!;

    const paymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!paymentMethod) {
      throw new ResourceNotFoundException('PaymentMethod', paymentMethodId);
    }

    const newEnabledStatus = !paymentMethod.enabled;

    return this.prismaService.paymentMethod.update({
      where: { id: paymentMethodId },
      data: {
        enabled: newEnabledStatus,
        updatedByUserId: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
