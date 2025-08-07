export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  birthDate?: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  birthDate?: Date | string | null;
  userType: 'owner' | 'collaborator';
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}