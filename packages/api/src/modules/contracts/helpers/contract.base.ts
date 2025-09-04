import { Injectable } from '@nestjs/common';
import { Contract, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { ResourceNotFoundException } from '../../../common/exceptions';
import { IRequestContext } from '@gymspace/shared';

export interface ContractFindOneOptions {
  include?: {
    gymClient?: boolean | {
      select?: {
        id?: boolean;
        name?: boolean;
        email?: boolean;
        phone?: boolean;
      };
    };
    gymMembershipPlan?: boolean | {
      select?: {
        id?: boolean;
        name?: boolean;
        basePrice?: boolean;
        durationMonths?: boolean;
        durationDays?: boolean;
      };
    };
    paymentMethod?: boolean;
    createdBy?: boolean | {
      select?: {
        id?: boolean;
        email?: boolean;
      };
    };
    gym?: boolean | {
      select?: {
        id?: boolean;
        name?: boolean;
      };
    };
  };
}

@Injectable()
export class ContractBaseService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Find a contract by ID with configurable relations
   * Validates access through gym context
   */
  async findOne(
    context: IRequestContext,
    contractId: string,
    options: ContractFindOneOptions = {}
  ): Promise<Contract> {
    const userId = context.getUserId();
    const prismaInclude: Prisma.ContractInclude = {};
    const { include } = options;

    if (include) {
      // Configure gymClient include
      if (include.gymClient) {
        if (typeof include.gymClient === 'boolean') {
          prismaInclude.gymClient = {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          };
        } else {
          prismaInclude.gymClient = include.gymClient;
        }
      }

      // Configure gymMembershipPlan include
      if (include.gymMembershipPlan) {
        if (typeof include.gymMembershipPlan === 'boolean') {
          prismaInclude.gymMembershipPlan = {
            select: {
              id: true,
              name: true,
              basePrice: true,
              durationMonths: true,
              durationDays: true,
            },
          };
        } else {
          prismaInclude.gymMembershipPlan = include.gymMembershipPlan;
        }
      }

      // Configure paymentMethod include
      if (include.paymentMethod) {
        prismaInclude.paymentMethod = true;
      }

      // Configure createdBy include
      if (include.createdBy) {
        if (typeof include.createdBy === 'boolean') {
          prismaInclude.createdBy = {
            select: {
              id: true,
              email: true,
            },
          };
        } else {
          prismaInclude.createdBy = include.createdBy;
        }
      }
    }

    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gym: {
            OR: [
              { organization: { ownerUserId: userId } },
              { collaborators: { some: { userId, status: 'active' } } },
            ],
          },
        },
        deletedAt: null,
      },
      include: prismaInclude,
    });

    if (!contract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }

    return contract;
  }

  /**
   * Check if contract exists and user has access through gym
   */
  async validateContractExists(
    context: IRequestContext,
    contractId: string
  ): Promise<void> {
    const userId = context.getUserId();
    
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gym: {
            OR: [
              { organization: { ownerUserId: userId } },
              { collaborators: { some: { userId, status: 'active' } } },
            ],
          },
        },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!contract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }
  }
}