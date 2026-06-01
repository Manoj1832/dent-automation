import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  type?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'dentflow-dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, phone: true, isArchived: true }
      });
      if (!patient || patient.isArchived) return null;
      return { type: 'PATIENT', ...patient };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}
