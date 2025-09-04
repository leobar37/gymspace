export interface ClientStat {
  key: string;
  name: string;
  description: string;
  category: 'activity' | 'contracts' | 'general';
  query: (tx: any, clientId: string) => Promise<any>;
  format: (value: any) => any;
}

export interface ClientStatsResult {
  client: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    registrationDate: Date;
  };
  activity: {
    totalCheckIns: number;
    monthlyCheckIns: number;
    lastCheckIn: Date | null;
  };
  contracts: {
    active: number;
    totalSpent: number;
  };
  membershipHistory: any[];
}
