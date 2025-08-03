import { IsOptional, IsString, IsNumberString, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchCatalogDto {
  @ApiProperty({ example: 'crossfit', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'New York', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '40.7128', required: false })
  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @ApiProperty({ example: '-74.0060', required: false })
  @IsOptional()
  @IsLongitude()
  longitude?: string;

  @ApiProperty({ example: '10', description: 'Radius in kilometers', required: false })
  @IsOptional()
  @IsNumberString()
  radius?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({ example: '0', required: false })
  @IsOptional()
  @IsNumberString()
  offset?: string;
}
