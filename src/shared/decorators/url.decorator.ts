// shared/decorators/url.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Url = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // دریافت url از body یا query
    return request.body?.url || request.query?.url || null;
  },
);