import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { jwtConstants } from './jwt.constants';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.accessSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    PrismaService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
