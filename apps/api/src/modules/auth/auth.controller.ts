import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto } from './dto';
import { CurrentUser } from '../../common/decorators';
import { LOGIN_RATE_LIMIT, RateLimit } from '../rate-limiter/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit('login', LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowSeconds)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @RateLimit('register', LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowSeconds)
  async createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}