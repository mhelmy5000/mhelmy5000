import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Phase-1 login. In production this endpoint is replaced/augmented by the
 * OIDC/SAML/Entra callback; the federated identity is resolved to a Helm user
 * and the same token-issuing path runs.
 */
export class LoginDto {
  @ApiProperty({ example: 'minister@gov.example' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Tenant slug; inferred if omitted for single-tenant users.' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
