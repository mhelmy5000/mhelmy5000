import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Check-in on a key result — typically just the current value moves. */
export class UpdateKeyResultDto {
  @ApiProperty({ example: 75, description: 'Latest observed value.' })
  @IsNumber()
  currentValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
