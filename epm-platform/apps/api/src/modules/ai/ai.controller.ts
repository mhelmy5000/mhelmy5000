import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { AuthUser } from '../../common/auth/auth-user';
import { QueryKpiDto } from '../kpi/dto/query-kpi.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('kpi-analysis')
  @RequirePermissions('kpi:read', 'ai:use')
  @ApiOperation({ summary: 'AI analysis of the current KPI scorecard (provider-agnostic).' })
  analyzeKpis(@CurrentUser() user: AuthUser, @Query() query: QueryKpiDto) {
    return this.ai.analyzeKpis(user, query);
  }

  @Post('executive-summary')
  @RequirePermissions('ai:use')
  @ApiOperation({ summary: 'Generate an executive summary for the tenant.' })
  executiveSummary(@CurrentUser() user: AuthUser, @Body('period') period?: string) {
    return this.ai.executiveSummary(user, period);
  }
}
