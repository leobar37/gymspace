import { IsString, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @ApiProperty({ example: 'uuid-product-id', description: 'Product ID' })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity of product' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 29.99, description: 'Unit price at time of sale' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}
