import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateKpiDto } from './create-kpi.dto';

/** All create fields optional except the immutable `code`. */
export class UpdateKpiDto extends PartialType(OmitType(CreateKpiDto, ['code'] as const)) {}
