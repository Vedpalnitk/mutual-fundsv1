import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  ownerId?: string;
  allowedPages?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET must be configured. Set jwt.secret in your configuration or JWT_SECRET env variable.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const result: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // For staff users, load fresh permissions from DB instead of trusting stale JWT
    if (payload.ownerId) {
      result.ownerId = payload.ownerId;
      const staffMember = await this.prisma.fAStaffMember.findFirst({
        where: { staffUserId: user.id, isActive: true },
        select: { allowedPages: true },
      });
      result.allowedPages = (staffMember?.allowedPages as string[]) ?? [];
    }

    return result;
  }
}
