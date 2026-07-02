import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Creates a portfolio item (strategic initiative) on the value/risk matrix. */
export class CreateInitiativeDto {
  @ApiProperty({ example: 'Digital Government Platform' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portfolioId?: string;

  @ApiProperty({ minimum: 0, maximum: 10, description: 'Strategic value (matrix Y).' })
  @IsNumber()
  @Min(0)
  @Max(10)
  strategicValue!: number;

  @ApiProperty({ minimum: 0, maximum: 10, description: 'Execution risk (matrix X).' })
  @IsNumber()
  @Min(0)
  @Max(10)
  executionRisk!: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Budget in $M.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessCase?: string;
}
