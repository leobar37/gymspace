import { IsNotEmpty, IsString, IsBoolean, IsObject, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ClientManagementDto {
  @ApiProperty({ example: true, description: 'Enable client registration and management' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, description: 'Require document ID for clients' })
  @IsBoolean()
  requireDocumentId: boolean;

  @ApiProperty({ example: true, description: 'Enable client photo uploads' })
  @IsBoolean()
  enablePhotos: boolean;

  @ApiProperty({ example: true, description: 'Track emergency contacts' })
  @IsBoolean()
  trackEmergencyContacts: boolean;

  @ApiProperty({ example: true, description: 'Track medical conditions' })
  @IsBoolean()
  trackMedicalConditions: boolean;
}

class MembershipManagementDto {
  @ApiProperty({ example: true, description: 'Enable membership plans and contracts' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, description: 'Allow custom pricing for contracts' })
  @IsBoolean()
  allowCustomPricing: boolean;

  @ApiProperty({ example: true, description: 'Enable contract freezing' })
  @IsBoolean()
  allowContractFreezing: boolean;

  @ApiProperty({ example: 30, description: 'Days before expiry to mark as expiring soon' })
  @IsNumber()
  @Min(1)
  expiryWarningDays: number;

  @ApiProperty({ example: true, description: 'Send automatic renewal reminders' })
  @IsBoolean()
  autoRenewalReminders: boolean;
}

class CheckInSystemDto {
  @ApiProperty({ example: true, description: 'Enable check-in tracking' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, description: 'Require active contract for check-in' })
  @IsBoolean()
  requireActiveContract: boolean;

  @ApiProperty({ example: true, description: 'Track check-in times' })
  @IsBoolean()
  trackCheckInTime: boolean;

  @ApiProperty({ example: false, description: 'Allow multiple check-ins per day' })
  @IsBoolean()
  allowMultiplePerDay: boolean;
}

class EvaluationSystemDto {
  @ApiProperty({ example: true, description: 'Enable physical evaluations' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, description: 'Track body measurements' })
  @IsBoolean()
  trackMeasurements: boolean;

  @ApiProperty({ example: true, description: 'Track body composition' })
  @IsBoolean()
  trackBodyComposition: boolean;

  @ApiProperty({ example: true, description: 'Track performance metrics' })
  @IsBoolean()
  trackPerformance: boolean;

  @ApiProperty({ example: 90, description: 'Default days between evaluations' })
  @IsNumber()
  @Min(1)
  defaultFrequencyDays: number;
}

class LeadManagementDto {
  @ApiProperty({ example: true, description: 'Enable lead capture and management' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, description: 'Show gym in public catalog' })
  @IsBoolean()
  publicCatalogListing: boolean;

  @ApiProperty({ example: true, description: 'Enable online lead form' })
  @IsBoolean()
  enableOnlineForm: boolean;

  @ApiProperty({ example: true, description: 'Auto-assign leads to staff' })
  @IsBoolean()
  autoAssignLeads: boolean;
}

class NotificationSettingsDto {
  @ApiProperty({ example: true, description: 'Enable email notifications' })
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty({ example: false, description: 'Enable SMS notifications' })
  @IsBoolean()
  smsEnabled: boolean;

  @ApiProperty({ example: true, description: 'Send welcome emails to new clients' })
  @IsBoolean()
  welcomeEmails: boolean;

  @ApiProperty({ example: true, description: 'Send contract expiry notifications' })
  @IsBoolean()
  contractExpiryAlerts: boolean;

  @ApiProperty({ example: true, description: 'Send evaluation reminders' })
  @IsBoolean()
  evaluationReminders: boolean;
}

export class ConfigureFeaturesDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Gym ID to configure' })
  @IsNotEmpty()
  @IsString()
  gymId: string;

  @ApiProperty({ type: ClientManagementDto, description: 'Client management features' })
  @ValidateNested()
  @Type(() => ClientManagementDto)
  clientManagement: ClientManagementDto;

  @ApiProperty({ type: MembershipManagementDto, description: 'Membership and contract features' })
  @ValidateNested()
  @Type(() => MembershipManagementDto)
  membershipManagement: MembershipManagementDto;

  @ApiProperty({ type: CheckInSystemDto, description: 'Check-in system features' })
  @ValidateNested()
  @Type(() => CheckInSystemDto)
  checkInSystem: CheckInSystemDto;

  @ApiProperty({ type: EvaluationSystemDto, description: 'Evaluation system features' })
  @ValidateNested()
  @Type(() => EvaluationSystemDto)
  evaluationSystem: EvaluationSystemDto;

  @ApiProperty({ type: LeadManagementDto, description: 'Lead management features' })
  @ValidateNested()
  @Type(() => LeadManagementDto)
  leadManagement: LeadManagementDto;

  @ApiProperty({ type: NotificationSettingsDto, description: 'Notification settings' })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;
}