export interface CreateInvitationDto {
  email: string;
  gymId: string;
  roleId: string;
}

export interface AcceptInvitationDto {
  name: string;
  phone: string;
  password: string;
}

export interface Invitation {
  id: string;
  email: string;
  gymId: string;
  roleId: string;
  token: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  invitedById: string;
  acceptedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetGymInvitationsParams {
  gymId: string;
}