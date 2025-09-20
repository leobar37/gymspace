import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListOrganizationsResponseDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'uuid-of-organization',
  })
  id: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Fitness Empire',
  })
  name: string;

  @ApiProperty({
    description: 'Organization owner information',
  })
  owner: {
    id: string;
    email: string;
    fullName: string;
  };

  @ApiProperty({
    description: 'List of gyms belonging to this organization',
  })
  gyms: Array<{
    id: string;
    name: string;
    address: string;
  }>;

  @ApiProperty({
    description: 'Organization creation date',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  // Enhanced fields for admin view
  @ApiPropertyOptional({
    description: 'Current subscription information',
  })
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    isExpiring: boolean;
    isExpired: boolean;
    daysUntilExpiration: number;
  };

  @ApiPropertyOptional({
    description: 'Usage statistics against plan limits',
  })
  usage?: {
    gyms: {
      current: number;
      limit: number;
      percentage: number;
    };
    clients: {
      current: number;
      limit: number;
      percentage: number;
    };
    collaborators: {
      current: number;
      limit: number;
      percentage: number;
    };
  };

  @ApiPropertyOptional({
    description: 'Organization country and currency',
  })
  locale?: {
    country: string;
    currency: string;
    timezone: string;
  };
}
