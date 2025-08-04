import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../services/request-context.service';

export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.requestContext;
  },
);
