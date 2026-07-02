import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser, Public } from '../../common/auth/decorators';
import { AuthUser } from '../../common/auth/auth-user';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Exchange an identity for a JWT (Phase 1 / federation stub).' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.tenantSlug);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the current authenticated principal.' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
