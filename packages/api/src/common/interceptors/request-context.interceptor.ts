import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Create a new instance of RequestContextService for this request
    const requestContextService = new RequestContextService();

    // Initialize request context from the request
    const requestContext = requestContextService.fromRequest(request);

    // Attach to request for access in decorators
    request.requestContext = requestContext;

    return next.handle();
  }
}
