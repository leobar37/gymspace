import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../services/request-context.service';

export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContextService => {
    const request = ctx.switchToHttp().getRequest();
    return request.requestContext;
  },
);
