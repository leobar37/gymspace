import { ApiProperty } from '@nestjs/swagger';

export class CheckInsDto {
  @ApiProperty({
    description: 'Total number of check-ins in the specified period',
    example: 345,
  })
  totalCheckIns: number;

  @ApiProperty({
    description: 'Number of unique clients who checked in',
    example: 89,
  })
  uniqueClients: number;

  @ApiProperty({
    description: 'Average check-ins per day',
    example: 11.13,
  })
  averagePerDay: number;

  @ApiProperty({
    description: 'Start date of the data range',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the data range',
    example: '2024-01-31T23:59:59.999Z',
  })
  endDate: string;
}