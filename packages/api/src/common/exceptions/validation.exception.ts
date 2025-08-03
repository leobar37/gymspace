import { HttpException, HttpStatus } from '@nestjs/common';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationException extends HttpException {
  constructor(errors: ValidationError[]) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
