import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { AuthUser } from './auth-user';

/** Marks a route as not requiring authentication. */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Declares the permission keys required to invoke a route (RBAC). */
export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...perms: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, perms);

/** Injects the authenticated user (or a single property of it) into a handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | AuthUser[keyof AuthUser] => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? req.user[data] : req.user;
  },
);
