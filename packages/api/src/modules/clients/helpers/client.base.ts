import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { RequestContext } from '../../../common/services/request-context.service';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { Prisma } from '@prisma/client';
import { ClientFindOneOptions } from '../domain/client-base.types';

@Injectable()
export class ClientBaseService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Find a client by ID with configurable relations
   */
  async findOne(ctx: RequestContext, clientId: string, options: ClientFindOneOptions = {}) {
    const prismaInclude: Prisma.GymClientInclude = {};
    const { include } = options;

    if (!include) {
      // No relations to include
    } else {
      // Configure checkIns include
      if (include.checkIns) {
        if (typeof include.checkIns === 'boolean') {
          prismaInclude.checkIns = {
            orderBy: { createdAt: 'desc' },
            take: 1,
          };
        } else {
          prismaInclude.checkIns = {
            orderBy: include.checkIns.orderBy || { createdAt: 'desc' },
            take: include.checkIns.take || 1,
          };
        }
      }

      // Configure evaluations include
      if (include.evaluations) {
        if (typeof include.evaluations === 'boolean') {
          prismaInclude.evaluations = {
            orderBy: { createdAt: 'desc' },
            take: 1,
          };
        } else {
          prismaInclude.evaluations = {
            orderBy: include.evaluations.orderBy || { createdAt: 'desc' },
            take: include.evaluations.take || 1,
          };
        }
      }

      // Configure contracts include
      if (include.contracts) {
        if (typeof include.contracts === 'boolean') {
          prismaInclude.contracts = {
            where: { status: 'active' },
            orderBy: { endDate: 'desc' },
          };
        } else {
          const contractInclude: any = {
            where: include.contracts.where,
            orderBy: include.contracts.orderBy,
            take: include.contracts.take,
          };

          if (include.contracts.plan) {
            contractInclude.include = {
              gymMembershipPlan: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  durationMonths: true,
                },
              },
            };
          }

          prismaInclude.contracts = contractInclude;
        }
      }

      // Configure gym include
      if (include.gym) {
        prismaInclude.gym = {
          select: {
            id: true,
            name: true,
          },
        };
      }

      // Configure counts include
      if (include.counts) {
        prismaInclude._count = {
          select: {
            contracts: true,
            evaluations: true,
            checkIns: true,
          },
        };
      }
    }

    const client = await this.prismaService.gymClient.findUnique({
      where: {
        id: clientId,
        gymId: ctx.gym.id,
        deletedAt: null,
      },
      include: prismaInclude,
    });

    if (!client) {
      throw new ResourceNotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Check if client exists and belongs to the gym
   */
  async validateClientExists(ctx: RequestContext, clientId: string): Promise<void> {
    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: clientId,
        gymId: ctx.gym.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!client) {
      throw new ResourceNotFoundException('Client not found');
    }
  }
}
