import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { KpiModule } from '../kpi/kpi.module';

@Module({
  imports: [KpiModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
