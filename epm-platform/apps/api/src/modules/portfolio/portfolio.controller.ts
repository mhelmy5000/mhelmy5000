import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { CreateInitiativeDto } from './dto/create-initiative.dto';
import { CurrentUser, RequirePermissions } from '../../common/auth/decorators';
import { AuthUser } from '../../common/auth/auth-user';

@ApiTags('portfolio')
@ApiBearerAuth()
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('matrix')
  @RequirePermissions('portfolio:read')
  @ApiOperation({ summary: 'Value/risk matrix: items + quadrants + summary + priority order.' })
  matrix(@CurrentUser() user: AuthUser) {
    return this.portfolio.matrix(user);
  }

  @Post('initiatives')
  @RequirePermissions('portfolio:create')
  @ApiOperation({ summary: 'Add a portfolio initiative (demand intake).' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInitiativeDto) {
    return this.portfolio.create(user, dto);
  }
}
