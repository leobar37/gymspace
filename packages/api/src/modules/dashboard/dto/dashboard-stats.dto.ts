import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Total number of clients in the gym',
    example: 156,
  })
  totalClients: number;

  @ApiProperty({
    description: 'Number of active clients (with active contracts)',
    example: 142,
  })
  activeClients: number;

  @ApiProperty({
    description: 'Total number of contracts',
    example: 168,
  })
  totalContracts: number;

  @ApiProperty({
    description: 'Number of active contracts',
    example: 142,
  })
  activeContracts: number;

  @ApiProperty({
    description: 'Monthly revenue for the current month',
    example: 4250.0,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: 'Number of check-ins today',
    example: 23,
  })
  todayCheckIns: number;

  @ApiProperty({
    description: 'Number of contracts expiring in the next 30 days',
    example: 8,
  })
  expiringContractsCount: number;

  @ApiProperty({
    description: 'Number of new clients registered this month',
    example: 12,
  })
  newClientsThisMonth: number;
}
