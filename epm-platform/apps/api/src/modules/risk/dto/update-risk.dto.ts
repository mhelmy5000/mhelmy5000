import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRiskDto } from './create-risk.dto';

/** All create fields optional except the immutable `code`. */
export class UpdateRiskDto extends PartialType(OmitType(CreateRiskDto, ['code'] as const)) {}
