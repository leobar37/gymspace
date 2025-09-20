import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IRequestContext } from '@gymspace/shared';

@Injectable()
export class SaleNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSaleNumber(context: IRequestContext): Promise<string> {
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
}