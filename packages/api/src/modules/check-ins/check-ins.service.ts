import { IRequestContext } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import { CheckIn, Prisma } from '@prisma/client';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { PrismaService } from '../../core/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { CreateCheckInDto, SearchCheckInsDto } from './dto';

@Injectable()
export class CheckInsService {
  constructor(
    private prismaService: PrismaService,
    private clientsService: ClientsService,
  ) {}

  /**
   * Create a check-in (CU-009)
   */
  async createCheckIn(context: IRequestContext, dto: CreateCheckInDto): Promise<CheckIn> {
    const gymId = context.getGymId()!;
    const userId = context.getUserId()!;

    // Use ClientsService to validate client and get active contract
    const client = await this.clientsService.validateClientBelongsToGym(context, dto.gymClientId);
    
    if (client.status !== 'active') {
      throw new BusinessException('El cliente no está activo');
    }

    // Check if client has active contract using ClientsService
    const activeContract = await this.clientsService.getActiveContract(context, dto.gymClientId);
    
    if (!activeContract) {
      throw new BusinessException(
        'El cliente no tiene un contrato activo o el contrato ha expirado',
      );
    }

    // Check if client already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await this.prismaService.checkIn.findFirst({
      where: {
        gymClientId: dto.gymClientId,
        gymId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckIn) {
      throw new BusinessException('El cliente ya se registró hoy');
    }

    // Create check-in
    const checkIn = await this.prismaService.checkIn.create({
      data: {
        gymClientId: dto.gymClientId,
        gymId,
        notes: dto.notes,
        registeredByUserId: userId,
        createdByUserId: userId,
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
            clientNumber: true,
            status: true,
          },
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return checkIn;
  }

  /**
   * Get check-in by ID
   */
  async getCheckIn(context: IRequestContext, checkInId: string): Promise<CheckIn> {
    const userId = context.getUserId()!;
    const checkIn = await this.prismaService.checkIn.findFirst({
      where: {
        id: checkInId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!checkIn) {
      throw new ResourceNotFoundException('CheckIn', checkInId);
    }

    return checkIn;
  }

  /**
   * Search check-ins
   */
  async searchCheckIns(context: IRequestContext, dto: SearchCheckInsDto) {
    const gymId = context.getGymId()!;

    const where: Prisma.CheckInWhereInput = { gymId };

    // Apply filters
    if (dto.clientId) {
      where.gymClientId = dto.clientId;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        const endDate = new Date(dto.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const limit = dto.limit ? parseInt(dto.limit) : 20;
    const offset = dto.offset ? parseInt(dto.offset) : 0;

    const [checkIns, total] = await Promise.all([
      this.prismaService.checkIn.findMany({
        where,
        include: {
          gymClient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prismaService.checkIn.count({ where }),
    ]);

    return {
      checkIns,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Get check-in statistics for a gym
   */
  async getGymCheckInStats(
    context: IRequestContext,
    period: 'day' | 'week' | 'month' = 'month',
  ) {
    const gymId = context.getGymId()!;

    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Get check-ins grouped by date
    const checkIns = await this.prismaService.checkIn.findMany({
      where: {
        gymId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        gymClientId: true,
      },
    });

    // Group by date
    const checkInsByDate = checkIns.reduce(
      (acc, checkIn) => {
        const date = checkIn.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = new Set();
        }
        acc[date].add(checkIn.gymClientId);
        return acc;
      },
      {} as Record<string, Set<string>>,
    );

    // Convert to array format
    const dailyStats = Object.entries(checkInsByDate).map(([date, clients]) => ({
      date,
      totalCheckIns: clients.size,
    }));

    // Get unique clients
    const uniqueClients = new Set(checkIns.map((c) => c.gymClientId));

    // Get peak hour statistics
    const hourlyStats = checkIns.reduce(
      (acc, checkIn) => {
        const hour = checkIn.createdAt.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    const peakHour = Object.entries(hourlyStats).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 },
    );

    return {
      period,
      startDate,
      endDate: now,
      summary: {
        totalCheckIns: checkIns.length,
        uniqueClients: uniqueClients.size,
        averageDaily:
          checkIns.length /
          Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        peakHour: peakHour.hour,
      },
      dailyStats: dailyStats.sort((a, b) => a.date.localeCompare(b.date)),
      hourlyDistribution: hourlyStats,
    };
  }

  /**
   * Get client check-in history
   */
  async getClientCheckInHistory(context: IRequestContext, clientId: string, limit = 30) {
    // Use ClientsService to validate client belongs to gym
    const client = await this.clientsService.validateClientBelongsToGym(context, clientId);

    const checkIns = await this.prismaService.checkIn.findMany({
      where: { gymClientId: clientId },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate attendance metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCheckIns = checkIns.filter((checkIn) => checkIn.createdAt >= thirtyDaysAgo);

    return {
      checkIns,
      metrics: {
        totalCheckIns: await this.prismaService.checkIn.count({ where: { gymClientId: clientId } }),
        last30Days: recentCheckIns.length,
        attendanceRate: (recentCheckIns.length / 30) * 100,
        lastCheckIn: checkIns[0]?.createdAt || null,
      },
    };
  }

  /**
   * Get clients currently in the gym (checked in today)
   */
  async getCurrentlyInGym(context: IRequestContext) {
    const gymId = context.getGymId()!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIns = await this.prismaService.checkIn.findMany({
      where: {
        gymId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
            clientNumber: true,
            status: true,
            profilePhotoId: true,
          },
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get unique clients (in case of multiple check-ins per day, which shouldn't happen)
    const uniqueClients = new Map();
    checkIns.forEach((checkIn) => {
      if (!uniqueClients.has(checkIn.gymClientId)) {
        uniqueClients.set(checkIn.gymClientId, checkIn);
      }
    });

    return {
      total: uniqueClients.size,
      clients: Array.from(uniqueClients.values()),
    };
  }

  /**
   * Delete check-in (for correction purposes)
   */
  async deleteCheckIn(context: IRequestContext, checkInId: string): Promise<void> {
    const userId = context.getUserId()!;
    const checkIn = await this.prismaService.checkIn.findFirst({
      where: {
        id: checkInId,
        gym: {
          organization: { ownerUserId: userId },
        },
      },
    });

    if (!checkIn) {
      throw new ResourceNotFoundException('CheckIn', checkInId);
    }

    // Only allow deletion of check-ins from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn.createdAt < today) {
      throw new BusinessException('Can only delete check-ins from today');
    }

    await this.prismaService.checkIn.delete({
      where: { id: checkInId },
    });
  }
}
