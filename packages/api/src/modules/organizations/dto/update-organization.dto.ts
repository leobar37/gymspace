import { IsOptional, IsString, IsObject, IsISO31661Alpha2, IsCurrency } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiProperty({ example: 'US', required: false })
  @IsOptional()
  @IsString()
  @IsISO31661Alpha2()
  country?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  @IsCurrency()
  currency?: string;

  @ApiProperty({ example: 'America/New_York', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    example: {
      theme: 'light',
      language: 'en',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
