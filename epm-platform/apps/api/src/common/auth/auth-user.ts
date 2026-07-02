/**
 * The authenticated principal carried on every request after JWT validation.
 * `permissions` is the flattened set from all roles; `orgUnitScopes` drives
 * ABAC (empty = tenant-wide access).
 */
export interface AuthUser {
  sub: string; // user id
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  /** ABAC: org-unit subtree ids this user is scoped to (empty = whole tenant). */
  orgUnitScopes: string[];
}

/** JWT payload shape (what we sign / verify). */
export interface JwtPayload {
  sub: string;
  tid: string; // tenantId
  email: string;
  roles: string[];
  perms: string[];
  scopes: string[];
}
