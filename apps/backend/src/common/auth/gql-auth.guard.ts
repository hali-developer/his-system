import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlCtx = context.getArgByIndex(2) || {};
    const req = gqlCtx.req || {};

    const orgId = req.headers?.['x-org-id'];
    const branchId = req.headers?.['x-branch-id'];
    const userId = req.headers?.['x-user-id'];

    if (!orgId || !branchId || !userId) {
      throw new UnauthorizedException(
        'Missing required context headers: x-org-id, x-branch-id, x-user-id',
      );
    }

    return true;
  }
}
