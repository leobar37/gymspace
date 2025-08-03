export interface CreateClientDto {
  name: string;
  email: string;
  phone?: string;
  document?: string;
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
  document?: string;
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
  email: string;
  phone?: string;
  document?: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface SearchClientsParams {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}