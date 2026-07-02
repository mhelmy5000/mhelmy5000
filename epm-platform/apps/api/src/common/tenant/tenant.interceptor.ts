import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthUser } from '../auth/auth-user';
import { runWithTenant } from './tenant-context';

/**
 * Binds the authenticated user's tenant to the async context for the duration
 * of the request, so the Prisma RLS extension can set `app.tenant_id`. Runs
 * after the auth guard has populated `req.user`.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user) return next.handle();
    return runWithTenant({ tenantId: user.tenantId, userId: user.sub }, () => next.handle());
  }
}
