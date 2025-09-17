import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsInt, Min } from 'class-validator';

export enum RequestStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum RequestOperationFilter {
  ALL = 'all',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  RENEWAL = 'renewal',
  CANCELLATION = 'cancellation',
  ACTIVATION = 'activation',
}

export class RequestAnalyticsQueryDto {
  @ApiProperty({
    enum: RequestStatusFilter,
    default: RequestStatusFilter.ALL,
    description: 'Filter by request status',
  })
  @IsOptional()
  @IsEnum(RequestStatusFilter)
  status?: RequestStatusFilter = RequestStatusFilter.ALL;

  @ApiProperty({
    enum: RequestOperationFilter,
    default: RequestOperationFilter.ALL,
    description: 'Filter by operation type',
  })
  @IsOptional()
  @IsEnum(RequestOperationFilter)
  operationType?: RequestOperationFilter = RequestOperationFilter.ALL;

  @ApiProperty({
    required: false,
    description: 'Start date for filtering (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date for filtering (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by organization name',
  })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiProperty({
    required: false,
    description: 'Page number (default: 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class RequestMetricsDto {
  @ApiProperty({ description: 'Total requests in period' })
  totalRequests: number;

  @ApiProperty({ description: 'Pending requests count' })
  pendingRequests: number;

  @ApiProperty({ description: 'Approved requests count' })
  approvedRequests: number;

  @ApiProperty({ description: 'Rejected requests count' })
  rejectedRequests: number;

  @ApiProperty({ description: 'Cancelled requests count' })
  cancelledRequests: number;

  @ApiProperty({ description: 'Approval rate as percentage' })
  approvalRate: number;

  @ApiProperty({ description: 'Average processing time in hours' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Requests pending over 24 hours' })
  stalePendingRequests: number;
}

export class RequestOperationBreakdownDto {
  @ApiProperty({ description: 'Operation type' })
  operationType: string;

  @ApiProperty({ description: 'Request count for this operation' })
  count: number;

  @ApiProperty({ description: 'Approval rate for this operation' })
  approvalRate: number;

  @ApiProperty({ description: 'Average processing time in hours' })
  avgProcessingTime: number;
}

export class RequestAnalyticsDto {
  @ApiProperty({ description: 'Query filters applied' })
  filters: RequestAnalyticsQueryDto;

  @ApiProperty({ description: 'Overall request metrics' })
  metrics: RequestMetricsDto;

  @ApiProperty({ 
    type: [RequestOperationBreakdownDto],
    description: 'Breakdown by operation type' 
  })
  operationBreakdown: RequestOperationBreakdownDto[];

  @ApiProperty({ 
    type: [Object],
    description: 'Request volume trend over time',
    example: [{ date: '2024-01-01', requests: 15, approved: 12, rejected: 2, pending: 1 }]
  })
  volumeTrend: Array<{
    date: string;
    requests: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;

  @ApiProperty({ description: 'Date when analytics were generated' })
  generatedAt: string;
}