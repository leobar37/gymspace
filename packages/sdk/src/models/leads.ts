import { PaginationQueryDto, LeadStatus } from '@gymspace/shared';

export interface CreateLeadDto {
  name: string;
  email: string;
  phone: string;
  gymId: string;
  message?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeadDto {
  status?: LeadStatus;
  notes?: string;
  assignedToUserId?: string;
  metadata?: Record<string, any>;
}

export interface Lead {
  id: string;
  gymId: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source?: string;
  message?: string;
  notes?: string;
  assignedToUserId?: string;
  convertedToClientId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchLeadsParams extends PaginationQueryDto {
  status?: LeadStatus;
  search?: string;
  assignedToUserId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  conversionRate: number;
  averageResponseTime: number;
  bySource: Record<string, number>;
}