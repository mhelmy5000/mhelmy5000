import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthUser, JwtPayload } from './auth-user';

/**
 * Validates the bearer JWT and maps its payload to the request's AuthUser.
 * In production the token is issued by our AuthService after OIDC/SAML/Entra
 * federation; the payload already carries resolved roles/permissions/scopes.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwtSecret') ?? 'change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      sub: payload.sub,
      tenantId: payload.tid,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.perms ?? [],
      orgUnitScopes: payload.scopes ?? [],
    };
  }
}
