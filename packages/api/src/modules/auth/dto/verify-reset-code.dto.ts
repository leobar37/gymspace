import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({
    description: 'Email address associated with the reset code',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Reset code received via email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

export class VerifyResetCodeResponseDto {
  @ApiProperty({
    description: 'Temporary token for password reset',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 1200,
  })
  expiresIn: number;
}
