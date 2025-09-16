import { ApiProperty } from '@nestjs/swagger';

export class SalesRevenueDto {
  @ApiProperty({
    description: 'Total revenue from sales in the specified period',
    example: 5250.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Number of sales transactions',
    example: 156,
  })
  salesCount: number;

  @ApiProperty({
    description: 'Average revenue per sale',
    example: 33.65,
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
