import { ApiProperty } from '@nestjs/swagger';

export class AvailablePlanDto {
  @ApiProperty({
    description: 'Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Gratuito',
  })
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Plan gratuito para comenzar - 30 días de prueba',
  })
  description: string | null;

  @ApiProperty({
    description: 'Price information by currency',
    example: {
      USD: { currency: 'USD', value: 0 },
      COP: { currency: 'COP', value: 0 },
      MXN: { currency: 'MXN', value: 0 },
      USD_EC: { currency: 'USD', value: 0 },
    },
  })
  price: any;

  @ApiProperty({
    description: 'Billing frequency',
    example: 'monthly',
  })
  billingFrequency: string;

  @ApiProperty({
    description: 'Maximum number of gyms allowed',
    example: 1,
  })
  maxGyms: number;

  @ApiProperty({
    description: 'Maximum clients per gym',
    example: 10,
  })
  maxClientsPerGym: number;

  @ApiProperty({
    description: 'Maximum users per gym',
    example: 1,
  })
  maxUsersPerGym: number;

  @ApiProperty({
    description: 'Plan features',
    example: {
      evaluations: 5,
      checkIns: true,
      basicReports: false,
      emailSupport: false,
      trialPeriod: 30,
    },
  })
  features: any;

  @ApiProperty({
    description: 'Whether this is a free plan',
    example: true,
  })
  isFreePlan: boolean;
}
