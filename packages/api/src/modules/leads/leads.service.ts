import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { GymsService } from '../gyms/gyms.service';
import { CreateLeadDto, UpdateLeadDto, SearchLeadsDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Lead, Prisma, ClientStatus } from '@prisma/client';
import { LeadStatus } from '@gymspace/shared';

@Injectable()
export class LeadsService {
  constructor(
    private prismaService: PrismaService,
    private gymsService: GymsService,
  ) {}

  /**
   * Create a new lead from public catalog (CU-020)
   */
  async createLead(dto: CreateLeadDto): Promise<Lead> {
    // Verify gym exists and is visible in catalog
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: dto.gymId,
        isActive: true,
        catalogVisibility: true,
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', dto.gymId);
    }

    // Check if lead already exists
    const existingLead = await this.prismaService.lead.findFirst({
      where: {
        email: dto.email,
        gymId: dto.gymId,
        status: {
          in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.INTERESTED],
        },
      },
    });

    if (existingLead) {
      throw new BusinessException('A lead with this email already exists for this gym');
    }

    // Create lead
    const lead = await this.prismaService.lead.create({
      data: {
        ...dto,
        status: LeadStatus.NEW,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // TODO: Send notification to gym owner/staff

    return lead;
  }

  /**
   * Update lead status and information
   */
  async updateLead(leadId: string, dto: UpdateLeadDto, userId: string): Promise<Lead> {
    // Verify lead exists and user has access
    const lead = await this.prismaService.lead.findFirst({
      where: {
        id: leadId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
    });

    if (!lead) {
      throw new ResourceNotFoundException('Lead', leadId);
    }

    // Update lead
    const updated = await this.prismaService.lead.update({
      where: { id: leadId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
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
   * Get lead by ID
   */
  async getLead(leadId: string, userId: string): Promise<Lead> {
    const lead = await this.prismaService.lead.findFirst({
      where: {
        id: leadId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
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

    if (!lead) {
      throw new ResourceNotFoundException('Lead', leadId);
    }

    return lead;
  }

  /**
   * Search leads
   */
  async searchLeads(gymId: string, dto: SearchLeadsDto, userId: string) {
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const where: Prisma.LeadWhereInput = { gymId };

    // Apply filters
    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.assignedToUserId) {
      where.assignedToUserId = dto.assignedToUserId;
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

    const [leads, total] = await Promise.all([
      this.prismaService.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // NEW leads first
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prismaService.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Get lead statistics for a gym
   */
  async getLeadStats(gymId: string, userId: string) {
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      interestedLeads,
      convertedLeads,
      lostLeads,
      recentLeads,
      conversionRate,
    ] = await Promise.all([
      // Total leads
      this.prismaService.lead.count({ where: { gymId } }),
      // New leads
      this.prismaService.lead.count({
        where: { gymId, status: LeadStatus.NEW },
      }),
      // Contacted leads
      this.prismaService.lead.count({
        where: { gymId, status: LeadStatus.CONTACTED },
      }),
      // Interested leads
      this.prismaService.lead.count({
        where: { gymId, status: LeadStatus.INTERESTED },
      }),
      // Converted leads
      this.prismaService.lead.count({
        where: { gymId, status: LeadStatus.CONVERTED },
      }),
      // Lost leads
      this.prismaService.lead.count({
        where: { gymId, status: LeadStatus.LOST },
      }),
      // Recent leads (last 30 days)
      this.prismaService.lead.count({
        where: {
          gymId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // Conversion rate
      this.calculateConversionRate(gymId),
    ]);

    // Get leads by source
    const leadsBySource = await this.prismaService.lead.groupBy({
      by: ['source'],
      where: { gymId },
      _count: true,
    });

    // Get recent lead activity
    const recentActivity = await this.prismaService.lead.findMany({
      where: {
        gymId,
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return {
      summary: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        interested: interestedLeads,
        converted: convertedLeads,
        lost: lostLeads,
      },
      metrics: {
        recentLeads,
        conversionRate,
        averageResponseTime: await this.calculateAverageResponseTime(gymId),
      },
      sources: leadsBySource.map((item) => ({
        source: item.source || 'Unknown',
        count: item._count,
      })),
      recentActivity,
    };
  }

  /**
   * Convert lead to client
   */
  async convertLead(leadId: string, userId: string) {
    const lead = await this.prismaService.lead.findFirst({
      where: {
        id: leadId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
    });

    if (!lead) {
      throw new ResourceNotFoundException('Lead', leadId);
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BusinessException('Lead has already been converted');
    }

    // Check if client already exists
    const existingClient = await this.prismaService.gymClient.findFirst({
      where: {
        email: lead.email,
        gymId: lead.gymId,
      },
    });

    if (existingClient) {
      // Update lead status
      await this.prismaService.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedToClientId: existingClient.id,
          convertedAt: new Date(),
          updatedByUserId: userId,
        },
      });

      return { clientId: existingClient.id, message: 'Lead linked to existing client' };
    }

    // Create new client and update lead in transaction
    const result = await this.prismaService.$transaction(async (tx) => {
      const client = await tx.gymClient.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          gymId: lead.gymId,
          status: ClientStatus.active,
          clientNumber: await this.generateClientNumber(lead.gymId),
          createdByUserId: userId,
          notes: `Converted from lead #${leadId}. ${lead.message || ''}`.trim(),
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedToClientId: client.id,
          convertedAt: new Date(),
          updatedByUserId: userId,
        },
      });

      return client;
    });

    return { clientId: result.id, message: 'Lead converted to client successfully' };
  }

  /**
   * Generate unique client number
   */
  private async generateClientNumber(_gymId: string): Promise<string> {
    const timestamp = Date.now().toString();
    const lastDigits = timestamp.slice(-6);
    return `CLI-${lastDigits}`;
  }

  /**
   * Calculate conversion rate for a gym
   */
  private async calculateConversionRate(gymId: string): Promise<number> {
    const [total, converted] = await Promise.all([
      this.prismaService.lead.count({ where: { gymId } }),
      this.prismaService.lead.count({
        where: { gymId, status: LeadStatus.CONVERTED },
      }),
    ]);

    if (total === 0) return 0;
    return (converted / total) * 100;
  }

  /**
   * Calculate average response time for leads
   */
  private async calculateAverageResponseTime(gymId: string): Promise<number> {
    const leads = await this.prismaService.lead.findMany({
      where: {
        gymId,
        status: { not: LeadStatus.NEW },
        updatedAt: { not: undefined },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (leads.length === 0) return 0;

    const totalHours = leads.reduce((sum, lead) => {
      const hours = (lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round(totalHours / leads.length);
  }
}
