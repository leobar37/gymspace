import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiProperty({
    example: 'Mi Gimnasio Elite',
    description: 'Organization name',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre de la organización debe ser un texto válido' })
  @MinLength(2, { message: 'El nombre de la organización debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la organización no puede exceder 100 caracteres' })
  name: string;
}
