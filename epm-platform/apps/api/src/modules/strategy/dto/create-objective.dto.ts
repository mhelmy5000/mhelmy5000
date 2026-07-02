import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ObjectiveType {
  STRATEGIC = 'STRATEGIC',
  OKR = 'OKR',
  GOAL = 'GOAL',
}

export class CreateObjectiveDto {
  @ApiProperty({ example: 'Accelerate digital adoption' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ObjectiveType, default: ObjectiveType.STRATEGIC })
  @IsEnum(ObjectiveType)
  type!: ObjectiveType;

  @ApiPropertyOptional({ description: 'Balanced-Scorecard perspective id (strategic objectives).' })
  @IsOptional()
  @IsString()
  perspectiveId?: string;

  @ApiPropertyOptional({ description: 'Parent objective for cascading / alignment.' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Rollup weight.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
