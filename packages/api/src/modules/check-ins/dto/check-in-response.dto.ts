import { ApiProperty } from '@nestjs/swagger';

export class CheckInResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  gymClientId: string;

  @ApiProperty()
  gymId: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  registeredByUserId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    description: 'Client information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      clientNumber: 'CL001',
      status: 'active',
    },
  })
  gymClient: {
    id: string;
    name: string;
    email?: string;
    clientNumber: string;
    status: string;
  };

  @ApiProperty({
    description: 'User who registered the check-in',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Staff Member',
    },
  })
  registeredBy?: {
    id: string;
    name: string;
  };
}

export class CheckInListQueryDto {
  @ApiProperty({ required: false })
  clientId?: string;

  @ApiProperty({ required: false })
  startDate?: string;

  @ApiProperty({ required: false })
  endDate?: string;

  @ApiProperty({ required: false, default: 20 })
  limit?: number;

  @ApiProperty({ required: false, default: 0 })
  offset?: number;

  @ApiProperty({ required: false, description: 'Filter by currently in gym' })
  currentlyInGym?: boolean;
}

export class CurrentlyInGymResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty({
    type: [CheckInResponseDto],
    description: 'List of clients currently in the gym',
  })
  clients: CheckInResponseDto[];
}
