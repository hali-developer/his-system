import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from './request-context';

export const CurrentContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const gqlCtx = ctx.getArgByIndex(2) || {};
    const req = gqlCtx.req || {};

    return {
      organizationId: req.headers?.['x-org-id'] || 'org-1',
      branchId: req.headers?.['x-branch-id'] || 'branch-1',
      userId: req.headers?.['x-user-id'] || 'user-1',
      traceId: req.headers?.['x-trace-id'] || undefined,
      permissions: req.permissions || [],
    };
  },
);
