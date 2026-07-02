import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/auth/auth-user';

export interface LoginResult {
  accessToken: string;
  user: { id: string; email: string; displayName: string; tenantId: string; roles: string[] };
}

/**
 * Resolves an identity to a signed JWT carrying the user's tenant, roles,
 * flattened permissions and ABAC org-unit scopes — so downstream guards need no
 * further DB lookups on the hot path.
 *
 * NOTE: login runs *before* a tenant context exists, so the user/tenant lookup
 * below uses the base client (`prisma`, not `prisma.db`) on the `mizan_system`
 * (BYPASSRLS) connection — see infra/postgres/README.md. All post-auth,
 * tenant-scoped traffic goes through `prisma.db` (RLS-enforced).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, tenantSlug?: string): Promise<LoginResult> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        status: 'ACTIVE',
        deletedAt: null,
        ...(tenantSlug ? { tenant: { slug: tenantSlug } } : {}),
      },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException('invalid credentials');

    const roles = user.roles.map((r) => r.role.key);
    const permissions = dedupe(user.roles.flatMap((r) => r.role.permissions));
    const scopes = dedupe(
      user.roles.map((r) => r.scopeOrgUnitId).filter((s): s is string => Boolean(s)),
    );

    const payload: JwtPayload = {
      sub: user.id,
      tid: user.tenantId,
      email: user.email,
      roles,
      perms: permissions,
      scopes,
    };

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        tenantId: user.tenantId,
        roles,
      },
    };
  }
}

const dedupe = <T>(arr: T[]): T[] => [...new Set(arr)];
