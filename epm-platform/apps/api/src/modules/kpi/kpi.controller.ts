import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KpiService } from './kpi.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { QueryKpiDto } from './dto/query-kpi.dto';
import { RecordMeasurementDto } from './dto/record-measurement.dto';
import { CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { AuthUser } from '../../common/auth/auth-user';

@ApiTags('kpi')
@ApiBearerAuth()
@Controller('kpis')
export class KpiController {
  constructor(private readonly kpi: KpiService) {}

  @Get()
  @RequirePermissions('kpi:read')
  @ApiOperation({ summary: 'List KPIs with evaluated attainment and RAG status.' })
  list(@CurrentUser() user: AuthUser, @Query() query: QueryKpiDto) {
    return this.kpi.list(user, query);
  }

  @Get('scorecard')
  @RequirePermissions('kpi:read')
  @ApiOperation({ summary: 'Weighted scorecard: KPIs + overall attainment + RAG counts.' })
  scorecard(@CurrentUser() user: AuthUser, @Query() query: QueryKpiDto) {
    return this.kpi.scorecard(user, query);
  }

  @Get(':id')
  @RequirePermissions('kpi:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kpi.get(user, id);
  }

  @Post()
  @RequirePermissions('kpi:create')
  @ApiOperation({ summary: 'Create a KPI.' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateKpiDto) {
    return this.kpi.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('kpi:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateKpiDto) {
    return this.kpi.update(user, id, dto);
  }

  @Post(':id/measurements')
  @RequirePermissions('kpi:update')
  @ApiOperation({ summary: 'Record (or upsert) a measurement for a period.' })
  recordMeasurement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RecordMeasurementDto,
  ) {
    return this.kpi.recordMeasurement(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('kpi:delete')
  @ApiOperation({ summary: 'Soft-delete (archive) a KPI.' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kpi.remove(user, id);
  }
}
