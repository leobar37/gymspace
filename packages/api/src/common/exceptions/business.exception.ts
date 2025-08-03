import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, code?: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode,
        error: code || 'BUSINESS_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}
