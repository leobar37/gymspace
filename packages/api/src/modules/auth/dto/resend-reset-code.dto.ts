import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendResetCodeDto {
  @ApiProperty({
    description: 'Email address to resend the reset code',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResendResetCodeResponseDto {
  @ApiProperty({
    description: 'Indicates if the reset code was resent successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Reset code resent to your email',
  })
  message: string;
}
