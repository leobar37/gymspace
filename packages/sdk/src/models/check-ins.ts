import { PaginationQueryDto } from '@gymspace/shared';

export interface CreateCheckInDto {
  clientId: string;
  notes?: string;
}

export interface CheckIn {
  id: string;
  gymId: string;
  gymClientId: string;
  checkInTime: string;
  notes?: string;
  createdAt: string;
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