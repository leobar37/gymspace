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

export interface SearchCheckInsParams {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  offset?: string;
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

export interface GetClientCheckInHistoryParams {
  limit?: number;
}