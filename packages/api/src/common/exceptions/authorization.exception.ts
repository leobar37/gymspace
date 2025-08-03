import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthorizationException extends HttpException {
  constructor(
    message: string = 'You do not have permission to perform this action',
    requiredPermission?: string,
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'AUTHORIZATION_ERROR',
        message,
        requiredPermission,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
