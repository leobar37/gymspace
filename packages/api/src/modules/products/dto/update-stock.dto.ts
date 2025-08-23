import { IsNumber, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @ApiProperty({
    example: 10,
    description: 'New stock quantity (absolute value)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(0, { message: 'Quantity cannot be negative' })
  quantity: number;

  @ApiProperty({
    example: 'Restock from supplier ABC',
    description: 'Optional notes about the stock update',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Optional supplier ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Optional file ID for receipt/document',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}
