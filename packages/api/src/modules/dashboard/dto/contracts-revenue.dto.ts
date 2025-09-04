import { ApiProperty } from '@nestjs/swagger';

export class ContractsRevenueDto {
  @ApiProperty({
    description: 'Total revenue from contracts in the specified period',
    example: 15250.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Number of contracts contributing to this revenue',
    example: 45,
  })
  contractCount: number;

  @ApiProperty({
    description: 'Average revenue per contract',
    example: 338.89,
  })
  averageRevenue: number;

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