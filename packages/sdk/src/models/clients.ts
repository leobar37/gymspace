import { PaginationQueryDto } from '@gymspace/shared';

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
}

export interface ClientStats {
  totalContracts: number;
  activeContracts: number;
  totalCheckIns: number;
  checkInsThisMonth: number;
  lastCheckIn?: string;
  totalEvaluations: number;
  lastEvaluation?: string;
}

export interface SearchClientsParams extends PaginationQueryDto {
  search?: string;
  activeOnly?: boolean;
  clientNumber?: string;
  documentId?: string;
  includeContractStatus?: boolean;
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