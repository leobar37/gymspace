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
  schedule?: GymSchedule;
  socialMedia?: GymSocialMedia;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  open: string;
  close: string;
}

export interface DaySchedule {
  isOpen: boolean;
  slots?: TimeSlot[];
}

export interface GymSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface GymSocialMedia {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface UpdateGymScheduleDto {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface UpdateGymSocialMediaDto {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
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