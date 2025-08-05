import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from '../services/request-context.service';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Check if RequestContext already exists (created by AuthGuard)
    if (!request.requestContext) {
      // Create a new instance of RequestContext for this request
      const requestContext = new RequestContext();

      // Initialize request context from the request
      request.requestContext = requestContext.fromRequest(request);
    }

    return next.handle();
  }
}
