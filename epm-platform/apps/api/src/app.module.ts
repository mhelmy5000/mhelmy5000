import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { RiskModule } from './modules/risk/risk.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { AiModule } from './modules/ai/ai.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { PermissionsGuard } from './common/auth/permissions.guard';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuthModule,
    KpiModule,
    StrategyModule,
    RiskModule,
    PortfolioModule,
    AiModule,
  ],
  providers: [
    // Secure by default: JWT required everywhere except @Public(), then RBAC.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Bind the tenant to the async context so Prisma RLS sets app.tenant_id.
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
