export interface CreateGymDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  capacity?: number;
  amenities?: GymAmenities;
  settings?: GymSettings;
}

export interface UpdateGymDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  capacity?: number;
  amenities?: GymAmenities;
  settings?: GymSettings;
}

export interface GymAmenities {
  hasParking?: boolean;
  hasShowers?: boolean;
  hasLockers?: boolean;
  [key: string]: any;
}

export interface GymSettings {
  logo?: string;
  primaryColor?: string;
  [key: string]: any;
}

export interface Gym {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  capacity?: number;
  amenities?: GymAmenities;
  settings?: GymSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymStats {
  totalClients: number;
  activeClients: number;
  totalContracts: number;
  activeContracts: number;
  monthlyRevenue: number;
  checkInsToday: number;
  checkInsMonth: number;
}