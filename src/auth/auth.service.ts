import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
// import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Prisma, Player } from '@prisma/client';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { SignUpDto } from './dto/sign-up.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthPayload } from './auth-payload/auth-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  private logger = new Logger(AuthService.name);

  private getRefreshCookieConfig(): CookieOptions {
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const isProd = nodeEnv === 'production';

    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as CookieOptions['sameSite'],
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  private validateRefreshCsrfToken(req: Request) {
    const headerName =
      this.configService.get<string>('REFRESH_CSRF_HEADER_NAME') ??
      'x-refresh-csrf-token';

    const expectedSecret = this.configService.get<string>(
      'REFRESH_CSRF_SECRET',
    );

    if (!expectedSecret) {
      this.logger.warn(
        'REFRESH_CSRF_SECRET is not configured. Skipping refresh CSRF validation.',
      );

      return;
    }

    const headerKey = headerName.toLowerCase();
    const incomingToken = req.headers[headerKey] as string | undefined;

    if (!incomingToken || incomingToken !== expectedSecret) {
      throw new UnauthorizedException('Invalid CSRF token');
    }
  }

  private async handleSuccessfulAuth(
    player: Partial<Player>,
    res: Response,
    statusCode: number = 200,
  ) {
    const payload = this.createAuthPayload(player) as AuthPayload;
    const accessToken = this.getToken(payload, 'access');
    const refreshToken = this.getToken(payload, 'refresh');
    const hashedToken = await this.hashPassword(refreshToken);
    const playerId = player.id as string;
    const existingRefreshToken =
      await this.prismaService.refreshToken.findUnique({
        where: { playerId },
      });

    if (existingRefreshToken) {
      await this.prismaService.refreshToken.update({
        where: { playerId },
        data: { value: hashedToken },
      });
    } else {
      await this.prismaService.refreshToken.create({
        data: { playerId, value: hashedToken },
      });
    }

    res.cookie('refreshToken', refreshToken, this.getRefreshCookieConfig());
    res.status(statusCode).json({ accessToken, player });
  }

  private handleError(error: any, action: string) {
    this.logger.error(`Failed to ${action}`, (error as Error).stack);

    if (error instanceof UnauthorizedException) {
      throw error;
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Username is already taken');
    }

    throw new InternalServerErrorException(`Failed to ${action}`);
  }

  private createAuthPayload(player: Partial<Player>) {
    return { username: player.username, sub: player.id, jti: uuidv4() };
  }

  private getToken(payload: AuthPayload, type: 'access' | 'refresh') {
    return this.jwtService.sign(payload, {
      ...(type === 'refresh' && {
        secret: this.configService.get('JWT_REFRESH_SECRET') as string,
        expiresIn: '7d',
      }),
    });
  }

  private async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
  }

  async signUp(signUpDto: SignUpDto, res: Response) {
    try {
      const hashedPassword = await this.hashPassword(signUpDto.password);
      const player = await this.prismaService.player.create({
        data: {
          ...signUpDto,
          password: hashedPassword,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = player;

      await this.handleSuccessfulAuth(rest, res, 201);
    } catch (error) {
      this.handleError(error, 'sign up user');
    }
  }

  async signIn(player: Partial<Player>, res: Response) {
    try {
      await this.handleSuccessfulAuth(player, res);
    } catch (error) {
      this.handleError(error, 'sign in user');
    }
  }

  async refresh(req: Request, res: Response) {
    this.validateRefreshCsrfToken(req);

    const player = req.user as Partial<Player>;
    const refreshTokenFromCookie = (req.cookies as { refreshToken: string })[
      'refreshToken'
    ];

    try {
      const existingRefreshToken =
        await this.prismaService.refreshToken.findUnique({
          where: { playerId: player.id },
        });

      if (!existingRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isCorrectRefreshToken = await bcrypt.compare(
        refreshTokenFromCookie,
        existingRefreshToken.value,
      );

      if (!isCorrectRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = this.createAuthPayload(player) as AuthPayload;
      const accessToken = this.getToken(payload, 'access');

      res.json({ accessToken });
    } catch (error) {
      this.handleError(error, 'refresh token');
    }
  }

  async signOut(player: Partial<Player>, res: Response) {
    try {
      await this.prismaService.refreshToken.delete({
        where: { playerId: player.id },
      });

      res.clearCookie('refreshToken', this.getRefreshCookieConfig());
      res.sendStatus(200);
    } catch (error) {
      this.handleError(error, 'sign out user');
    }
  }

  async validatePlayer(username: string, pass: string) {
    const player = await this.prismaService.player.findUnique({
      where: { username },
    });

    if (!player) return null;

    const isCorrectPassword = await bcrypt.compare(pass, player.password);

    if (!isCorrectPassword) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = player;

    return rest;
  }

  // async validateClient(client: Socket & { user?: any }) {
  //   const token = (client.handshake.auth as { token: string | undefined })
  //     .token;

  //   if (!token) {
  //     throw new UnauthorizedException('No JWT token found');
  //   }

  //   const payload = await verifyToken(token, {
  //     secretKey: this.configService.get('JWT_ACCESS_SECRET') as string,
  //   });

  //   client.user = payload;
  // }
}
