import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { KpiCategory } from './create-kpi.dto';

export enum KpiStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class QueryKpiDto {
  @ApiPropertyOptional({ enum: KpiCategory })
  @IsOptional()
  @IsEnum(KpiCategory)
  category?: KpiCategory;

  @ApiPropertyOptional({ enum: KpiStatus })
  @IsOptional()
  @IsEnum(KpiStatus)
  status?: KpiStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;
}
