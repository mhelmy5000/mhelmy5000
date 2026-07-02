import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StrategyService } from './strategy.service';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateKeyResultDto } from './dto/update-key-result.dto';
import { CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { AuthUser } from '../../common/auth/auth-user';

@ApiTags('strategy')
@ApiBearerAuth()
@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategy: StrategyService) {}

  @Get('map')
  @RequirePermissions('strategy:read')
  @ApiOperation({ summary: 'Balanced Scorecard: perspectives → objectives → overall score.' })
  map(@CurrentUser() user: AuthUser) {
    return this.strategy.map(user);
  }

  @Get('okrs')
  @RequirePermissions('strategy:read')
  @ApiOperation({ summary: 'OKRs with key-result progress, objective score and status.' })
  okrs(@CurrentUser() user: AuthUser) {
    return this.strategy.okrs(user);
  }

  @Post('objectives')
  @RequirePermissions('strategy:create')
  @ApiOperation({ summary: 'Create a strategic objective, OKR or goal.' })
  createObjective(@CurrentUser() user: AuthUser, @Body() dto: CreateObjectiveDto) {
    return this.strategy.createObjective(user, dto);
  }

  @Patch('objectives/:objectiveId/key-results/:krId')
  @RequirePermissions('strategy:update')
  @ApiOperation({ summary: 'Check in on a key result; recomputes objective score.' })
  updateKeyResult(
    @CurrentUser() user: AuthUser,
    @Param('objectiveId') objectiveId: string,
    @Param('krId') krId: string,
    @Body() dto: UpdateKeyResultDto,
  ) {
    return this.strategy.updateKeyResult(user, objectiveId, krId, dto);
  }
}
