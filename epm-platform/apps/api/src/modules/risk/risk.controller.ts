import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskService } from './risk.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { QueryRiskDto } from './dto/query-risk.dto';
import { CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { AuthUser } from '../../common/auth/auth-user';

@ApiTags('risk')
@ApiBearerAuth()
@Controller('risks')
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  @Get()
  @RequirePermissions('risk:read')
  @ApiOperation({ summary: 'List risks with score, severity level and appetite status.' })
  list(@CurrentUser() user: AuthUser, @Query() query: QueryRiskDto) {
    return this.risk.list(user, query);
  }

  @Get('register')
  @RequirePermissions('risk:read')
  @ApiOperation({ summary: 'Risk register: evaluated risks + 5×5 heatmap + RAG summary.' })
  register(@CurrentUser() user: AuthUser, @Query() query: QueryRiskDto) {
    return this.risk.register(user, query);
  }

  @Get(':id')
  @RequirePermissions('risk:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.risk.get(user, id);
  }

  @Post()
  @RequirePermissions('risk:create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRiskDto) {
    return this.risk.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('risk:update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRiskDto) {
    return this.risk.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('risk:delete')
  @ApiOperation({ summary: 'Soft-delete (close) a risk.' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.risk.remove(user, id);
  }
}
