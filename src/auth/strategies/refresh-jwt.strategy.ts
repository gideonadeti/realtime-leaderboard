import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

import { UserRole } from 'generated/prisma';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get('JWT_REFRESH_SECRET') as string;

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req.cookies as { refreshToken: string }).refreshToken,
      ]),
      secretOrKey: secret,
    });
  }

  validate(payload: { sub: string; email: string; role: UserRole }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
