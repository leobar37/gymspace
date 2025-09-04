import { ApiProperty } from '@nestjs/swagger';

export class NewClientsDto {
  @ApiProperty({
    description: 'Number of new clients registered in the specified period',
    example: 25,
  })
  totalNewClients: number;

  @ApiProperty({
    description: 'Average new clients per day',
    example: 0.81,
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