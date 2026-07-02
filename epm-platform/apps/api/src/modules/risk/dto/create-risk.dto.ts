import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRiskDto {
  @ApiProperty({ example: 'R-01' })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: 'Cyber breach of citizen data' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 4 })
  @IsInt()
  @Min(1)
  @Max(5)
  likelihood!: number;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  impact!: number;

  @ApiPropertyOptional({ description: 'Tolerated residual score (appetite).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25)
  appetite?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;
}
