import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private requestContextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Initialize request context from the request
    const requestContext = this.requestContextService.fromRequest(request);

    // Attach to request for access in decorators
    request.requestContext = requestContext;

    return next.handle();
  }
}
