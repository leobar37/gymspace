import { Prisma } from '@prisma/client';

export interface ClientFindOneOptions {
  include?: {
    checkIns?:
      | boolean
      | {
          orderBy?: Prisma.CheckInOrderByWithRelationInput;
          take?: number;
        };
    evaluations?:
      | boolean
      | {
          orderBy?: Prisma.EvaluationOrderByWithRelationInput;
          take?: number;
        };
    contracts?:
      | boolean
      | {
          where?: Prisma.ContractWhereInput;
          orderBy?: Prisma.ContractOrderByWithRelationInput;
          take?: number;
          plan?: boolean;
        };
    gym?: boolean;
    counts?: boolean;
  };
}
