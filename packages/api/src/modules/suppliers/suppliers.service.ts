import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { 
  CreateSupplierDto, 
  UpdateSupplierDto, 
  SearchSuppliersDto 
} from './dto';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async createSupplier(gymId: string, dto: CreateSupplierDto, userId: string) {
    // Check for duplicate supplier name within gym
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        gymId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingSupplier) {
      throw new BusinessException('Supplier with this name already exists');
    }

    // Check for duplicate email if provided
    if (dto.email) {
      const supplierWithEmail = await this.prisma.supplier.findFirst({
        where: {
          gymId,
          email: dto.email,
          deletedAt: null,
        },
      });

      if (supplierWithEmail) {
        throw new BusinessException('Supplier with this email already exists');
      }
    }

    return this.prisma.supplier.create({
      data: {
        ...dto,
        gymId,
        createdByUserId: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateSupplier(supplierId: string, dto: UpdateSupplierDto, userId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new ResourceNotFoundException('Supplier not found');
    }

    // Check for duplicate name if updating name
    if (dto.name) {
      const existingSupplier = await this.prisma.supplier.findFirst({
        where: {
          gymId: supplier.gymId,
          name: dto.name,
          id: { not: supplierId },
          deletedAt: null,
        },
      });

      if (existingSupplier) {
        throw new BusinessException('Supplier with this name already exists');
      }
    }

    // Check for duplicate email if updating email
    if (dto.email) {
      const supplierWithEmail = await this.prisma.supplier.findFirst({
        where: {
          gymId: supplier.gymId,
          email: dto.email,
          id: { not: supplierId },
          deletedAt: null,
        },
      });

      if (supplierWithEmail) {
        throw new BusinessException('Supplier with this email already exists');
      }
    }

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async deleteSupplier(supplierId: string, userId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new ResourceNotFoundException('Supplier not found');
    }

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: {
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });
  }

  async getSupplier(supplierId: string, userId?: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!supplier) {
      throw new ResourceNotFoundException('Supplier not found');
    }

    return supplier;
  }

  async searchSuppliers(gymId: string, dto: SearchSuppliersDto, userId: string) {
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = dto;

    const where: Prisma.SupplierWhereInput = {
      gymId,
      deletedAt: null,
    };

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactInfo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.SupplierOrderByWithRelationInput] = sortOrder;

    const { skip, take } = this.paginationService.getSkipTake(page, limit);

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return this.paginationService.paginate({
      data: suppliers,
      total,
      page,
      limit,
    });
  }

  async getSupplierStats(gymId: string) {
    const totalSuppliers = await this.prisma.supplier.count({
      where: {
        gymId,
        deletedAt: null,
      },
    });

    const suppliersWithEmail = await this.prisma.supplier.count({
      where: {
        gymId,
        deletedAt: null,
        email: { not: null },
      },
    });

    const suppliersWithPhone = await this.prisma.supplier.count({
      where: {
        gymId,
        deletedAt: null,
        phone: { not: null },
      },
    });

    const suppliersWithAddress = await this.prisma.supplier.count({
      where: {
        gymId,
        deletedAt: null,
        address: { not: null },
      },
    });

    return {
      totalSuppliers,
      suppliersWithEmail,
      suppliersWithPhone,
      suppliersWithAddress,
      contactCompleteness: {
        email: totalSuppliers > 0 ? (suppliersWithEmail / totalSuppliers) * 100 : 0,
        phone: totalSuppliers > 0 ? (suppliersWithPhone / totalSuppliers) * 100 : 0,
        address: totalSuppliers > 0 ? (suppliersWithAddress / totalSuppliers) * 100 : 0,
      },
    };
  }
}