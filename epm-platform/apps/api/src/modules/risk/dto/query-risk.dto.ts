import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum RiskStatus {
  OPEN = 'OPEN',
  MITIGATING = 'MITIGATING',
  MONITORED = 'MONITORED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export class QueryRiskDto {
  @ApiPropertyOptional({ enum: RiskStatus })
  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}
