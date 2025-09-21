import { PaginationQueryDto } from '../types';

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  documentValue?: string;
  documentType?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  occupation?: string;
  notes?: string;
  profilePhotoId?: string;
  customData?: Record<string, any>;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  documentValue?: string;
  documentType?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  occupation?: string;
  notes?: string;
  profilePhotoId?: string;
  customData?: Record<string, any>;
}

export interface Client {
  id: string;
  gymId: string;
  clientNumber: string;
  name: string;
  email?: string;
  phone?: string;
  documentValue?: string;
  documentType?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  occupation?: string;
  notes?: string;
  customData?: Record<string, any>;
  status: 'active' | 'inactive';
  profilePhotoId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  createdAt: string;
  updatedAt: string;
  contracts?: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    gymMembershipPlan?: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    evaluations: number;
    checkIns: number;
  };
  hasCheckedInToday?: boolean;
  lastCheckIn?: {
    id: string;
    timestamp: string;
    createdAt: string;
  };
}

export interface ClientStat {
  key: string;
  name: string;
  description: string;
  category: 'activity' | 'contracts' | 'general';
  value: any;
}

export interface ClientStats {
  client: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    registrationDate: string;
  };
  activity: {
    totalCheckIns: number;
    monthlyCheckIns: number;
    lastCheckIn: string | null;
  };
  contracts: {
    active: number;
    totalSpent: number;
  };
  membershipHistory: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string | null;
    gymMembershipPlan: {
      id: string;
      name: string;
      basePrice: number;
    };
  }>;
}

export interface SearchClientsParams extends PaginationQueryDto {
  search?: string;
  activeOnly?: boolean;
  clientNumber?: string;
  documentId?: string;
  includeContractStatus?: boolean;
  notCheckedInToday?: boolean;
  checkedInToday?: boolean;
}

export interface ClientSearchForCheckInResponse {
  data: Client[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}