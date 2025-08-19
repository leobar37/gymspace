import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from 'src/core/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    // Log incoming request
    this.logger.debug(`Incoming ${method} ${url}`, 'HTTP');

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          const statusCode = response.statusCode;
          
          // Log completed request with Google Cloud Logging structure
          this.logger.logRequest(method, url, statusCode, responseTime);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          const statusCode = error.status || 500;
          
          // Log failed request
          this.logger.error(
            `Request failed: ${method} ${url}`,
            error.stack,
            'HTTP'
          );
          this.logger.logRequest(method, url, statusCode, responseTime);
        },
      }),
    );
  }
}