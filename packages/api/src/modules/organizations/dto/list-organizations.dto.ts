import { SubscriptionStatus } from '@gymspace/shared';

export class ListOrganizationsResponseDto {
  id: string;
  name: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  gyms: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  subscription?: {
    planName: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    isExpired: boolean;
  };
  createdAt: Date;
}
