import { ApiProperty } from '@nestjs/swagger';

export class DebtsDto {
  @ApiProperty({
    description: 'Total outstanding debt amount',
    example: 3500.0,
  })
  totalDebt: number;

  @ApiProperty({
    description: 'Number of clients with outstanding debts',
    example: 12,
  })
  clientsWithDebt: number;

  @ApiProperty({
    description: 'Average debt per client',
    example: 291.67,
  })
  averageDebt: number;

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