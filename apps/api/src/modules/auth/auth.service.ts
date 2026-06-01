import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { LoginDto, CreateUserDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim();
    const failKey = `failed_logins:${email}`;
    
    const failedCount = await this.rateLimiter.getRemaining(failKey);
    if (failedCount >= 5) {
      this.logger.warn(`Login blocked: Account locked for ${email} due to too many failed attempts`);
      throw new UnauthorizedException('Too many failed attempts. Account locked for 15 minutes.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await this.rateLimiter.incrementCounter(failKey, 900);
      this.logger.warn(`Login failed: User not found for email '${email}'`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed: Account deactivated for email '${email}'`);
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      await this.rateLimiter.incrementCounter(failKey, 900);
      this.logger.warn(`Login failed: Invalid password for email '${email}'`);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.rateLimiter.resetKey(failKey);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`User ${user.email} logged in`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'RECEPTIONIST',
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`User created: ${user.email} (${user.role})`);

    return user;
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }
}
