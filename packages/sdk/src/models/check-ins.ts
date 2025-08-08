import { PaginationQueryDto } from '../types';

export interface CreateCheckInDto {
  gymClientId: string;
  notes?: string;
}

export interface CheckIn {
  id: string;
  gymId: string;
  gymClientId: string;
  timestamp: string;
  notes?: string;
  registeredByUserId: string;
  createdAt: string;
  updatedAt: string;
  gymClient?: {
    id: string;
    name: string;
    email?: string;
    clientNumber: string;
    status: string;
  };
  registeredBy?: {
    id: string;
    name: string;
  };
}

export interface SearchCheckInsParams extends PaginationQueryDto {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetCheckInStatsParams {
  period: 'day' | 'week' | 'month';
}

export interface CheckInStats {
  period: string;
  totalCheckIns: number;
  uniqueClients: number;
  averagePerDay: number;
  peakHours: Record<string, number>;
  dayDistribution: Record<string, number>;
}

export interface GetClientCheckInHistoryParams extends PaginationQueryDto {
  // Additional check-in history specific parameters can be added here
}

export interface CurrentlyInGymResponse {
  total: number;
  clients: CheckIn[];
}

export interface CheckInListResponse {
  checkIns: CheckIn[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ClientCheckInHistory {
  checkIns: CheckIn[];
  metrics: {
    totalCheckIns: number;
    last30Days: number;
    attendanceRate: number;
    lastCheckIn: string | null;
  };
}