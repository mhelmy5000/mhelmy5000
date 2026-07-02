import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordMeasurementDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  periodEnd!: string;

  @ApiProperty({ example: 94 })
  @IsNumber()
  actual!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
