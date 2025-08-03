export enum UserType {
  OWNER = 'owner',
  COLLABORATOR = 'collaborator',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum CollaboratorStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum ContractStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum AssetStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export enum EvaluationType {
  INITIAL = 'initial',
  PROGRESS = 'progress',
  FINAL = 'final',
}

export enum EvaluationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CommentType {
  PROGRESS_NOTE = 'progress_note',
  PHONE_CALL = 'phone_call',
  MEETING = 'meeting',
  REMINDER = 'reminder',
  OTHER = 'other',
}

export enum AssetCategory {
  MEDICAL_DOCUMENT = 'medical_document',
  IDENTIFICATION = 'identification',
  INSURANCE = 'insurance',
  CONTRACT_COPY = 'contract_copy',
  OTHER = 'other',
}

export enum ContractAssetType {
  PAYMENT_RECEIPT = 'payment_receipt',
  CONTRACT_DOCUMENT = 'contract_document',
  IDENTIFICATION = 'identification',
  OTHER = 'other',
}

export enum EvaluationAssetStage {
  INITIAL = 'initial',
  PROGRESS = 'progress',
  FINAL = 'final',
}

export enum EvaluationAssetCategory {
  BODY_PHOTO = 'body_photo',
  MEASUREMENT_PHOTO = 'measurement_photo',
  DOCUMENT = 'document',
  REPORT = 'report',
  OTHER = 'other',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}