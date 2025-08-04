import { ApiProperty } from '@nestjs/swagger';

export enum ActivityType {
  CHECK_IN = 'check_in',
  NEW_CLIENT = 'new_client',
  NEW_CONTRACT = 'new_contract',
  CONTRACT_EXPIRED = 'contract_expired',
}

export class RecentActivityDto {
  @ApiProperty({
    description: 'Activity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Type of activity',
    enum: ActivityType,
    example: ActivityType.CHECK_IN,
  })
  type: ActivityType;

  @ApiProperty({
    description: 'Description of the activity',
    example: 'Check-in registrado',
  })
  description: string;

  @ApiProperty({
    description: 'Timestamp of the activity',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Name of the client related to the activity',
    example: 'Juan Pérez',
    required: false,
  })
  clientName?: string;

  @ApiProperty({
    description: 'ID of the client related to the activity',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  clientId?: string;
}