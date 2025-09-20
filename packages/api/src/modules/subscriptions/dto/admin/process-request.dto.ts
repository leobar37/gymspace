import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionRequestStatus } from './subscription-request-response.dto';

export class ProcessRequestDto {
  @ApiProperty({
    description: 'Action to take on the request',
    enum: SubscriptionRequestStatus,
    example: SubscriptionRequestStatus.APPROVED,
  })
  @IsEnum(SubscriptionRequestStatus)
  status: SubscriptionRequestStatus;

  @ApiProperty({
    description: 'Admin notes for the decision',
    example: 'Approved after verification of payment method',
    required: false,
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiProperty({
    description: 'Effective date for the subscription change (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}