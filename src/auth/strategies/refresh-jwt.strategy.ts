import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';

import { jwtConstants } from '../jwt.constants';
import { UserRole } from 'generated/prisma';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req.cookies as { refreshToken: string }).refreshToken,
      ]),
      secretOrKey: jwtConstants.refreshSecret as string,
    });
  }

  validate(payload: { sub: string; email: string; role: UserRole }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
