import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelContractDto {
  @ApiProperty({
    description: 'Reason for cancelling the contract',
    example: 'Medical reasons',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  reason: string;
}