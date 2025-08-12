import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} con identificador '${identifier}' no encontrado`
      : `${resource} no encontrado`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'RESOURCE_NOT_FOUND',
        message,
        resource,
        identifier,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
