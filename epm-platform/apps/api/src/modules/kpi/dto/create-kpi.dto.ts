import {
  IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KpiCategory {
  STRATEGIC = 'STRATEGIC',
  ENTERPRISE = 'ENTERPRISE',
  OPERATIONAL = 'OPERATIONAL',
  DEPARTMENT = 'DEPARTMENT',
  INDIVIDUAL = 'INDIVIDUAL',
}
export enum KpiDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
  TARGET_IS_BEST = 'TARGET_IS_BEST',
}
export enum Cadence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export class CreateKpiDto {
  @ApiProperty({ example: 'CSAT-01' })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: 'Customer satisfaction (CSAT)' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: KpiCategory, default: KpiCategory.OPERATIONAL })
  @IsEnum(KpiCategory)
  category!: KpiCategory;

  @ApiPropertyOptional({ example: '%' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ enum: KpiDirection, default: KpiDirection.HIGHER_IS_BETTER })
  @IsEnum(KpiDirection)
  direction!: KpiDirection;

  @ApiProperty({ enum: Cadence, default: Cadence.MONTHLY })
  @IsEnum(Cadence)
  frequency!: Cadence;

  @ApiPropertyOptional({ minimum: 0, description: 'Rollup weight for the scorecard.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiPropertyOptional({ description: 'RAG green threshold (direction-aware).' })
  @IsOptional()
  @IsNumber()
  thresholdGreen?: number;

  @ApiPropertyOptional({ description: 'RAG red threshold (direction-aware).' })
  @IsOptional()
  @IsNumber()
  thresholdRed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgUnitId?: string;
}
