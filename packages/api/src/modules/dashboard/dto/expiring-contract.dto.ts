import { ApiProperty } from '@nestjs/swagger';

export class ExpiringContractDto {
  @ApiProperty({
    description: 'Contract ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Client name',
    example: 'Ana Martínez',
  })
  clientName: string;

  @ApiProperty({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  clientId: string;

  @ApiProperty({
    description: 'Membership plan name',
    example: 'Plan Premium',
  })
  planName: string;

  @ApiProperty({
    description: 'Contract end date',
    example: '2024-01-20T00:00:00Z',
  })
  endDate: string;

  @ApiProperty({
    description: 'Days remaining until expiration',
    example: 5,
  })
  daysRemaining: number;
}
