import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { RiskRepository } from './risk.repository';

@Module({
  controllers: [RiskController],
  providers: [RiskService, RiskRepository],
  exports: [RiskService],
})
export class RiskModule {}
