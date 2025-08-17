import { IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @ApiProperty({
    example: 10,
    description: 'Quantity to add (positive) or remove (negative) from stock',
  })
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  quantity: number;
}
