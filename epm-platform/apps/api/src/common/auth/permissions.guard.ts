import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from './auth-user';
import { PERMISSIONS_KEY } from './decorators';

/**
 * RBAC enforcement: checks that the authenticated user holds every permission
 * declared via `@RequirePermissions(...)`. A wildcard permission (`*` or a
 * `resource:*` grant) satisfies any check in that resource — used by admin roles.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user) throw new ForbiddenException('missing authentication context');

    const held = new Set(user.permissions);
    const ok = required.every((perm) => held.has(perm) || held.has('*') || held.has(resourceWildcard(perm)));
    if (!ok) throw new ForbiddenException(`missing permission(s): ${required.join(', ')}`);
    return true;
  }
}

/** "kpi:update" → "kpi:*" */
function resourceWildcard(perm: string): string {
  const [resource] = perm.split(':');
  return `${resource}:*`;
}
