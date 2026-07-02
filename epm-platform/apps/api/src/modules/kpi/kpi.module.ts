import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KpiRepository } from './kpi.repository';

@Module({
  controllers: [KpiController],
  providers: [KpiService, KpiRepository],
  exports: [KpiService],
})
export class KpiModule {}
