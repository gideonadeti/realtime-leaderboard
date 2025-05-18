import * as bcrypt from 'bcryptjs';
import * as cookie from 'cookie';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from 'socket.io';
import { verifyToken } from '@clerk/express';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { jwtConstants } from './jwt.constants';
import { Prisma, User } from 'generated/prisma';
import { SignUpDto } from './dto/sign-up.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthPayload } from './auth-payload.interface';

const REFRESH_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  private logger = new Logger(AuthService.name);

  private async handleSuccessfulAuth(
    user: Partial<User>,
    res: Response,
    statusCode: number = 200,
  ) {
    const payload = this.createAuthPayload(user) as AuthPayload;
    const accessToken = this.getToken(payload, 'access');
    const refreshToken = this.getToken(payload, 'refresh');
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(refreshToken, salt);
    const userId = user.id as string;
    const existingRefreshToken =
      await this.prismaService.refreshToken.findUnique({
        where: { userId },
      });

    if (existingRefreshToken) {
      await this.prismaService.refreshToken.update({
        where: { userId },
        data: { value: hashedToken },
      });
    } else {
      await this.prismaService.refreshToken.create({
        data: { userId, value: hashedToken },
      });
    }

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_CONFIG);
    res.status(statusCode).json({ accessToken, user });
  }

  private handleAuthError(error: any, action: string) {
    this.logger.error(`Failed to ${action}`, (error as Error).stack);

    if (error instanceof UnauthorizedException) {
      throw error;
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Email is already in use');
    }

    throw new InternalServerErrorException(`Failed to ${action}`);
  }

  private createAuthPayload(user: Partial<User>) {
    return { email: user.email, sub: user.id, role: user.role, jti: uuidv4() };
  }

  private getToken(payload: AuthPayload, type: 'access' | 'refresh') {
    return this.jwtService.sign(payload, {
      ...(type === 'refresh' && {
        secret: jwtConstants.refreshSecret,
        expiresIn: '7d',
      }),
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
  }

  async signUp(signUpDto: SignUpDto, res: Response) {
    try {
      const hashedPassword = await this.hashPassword(signUpDto.password);
      const user = await this.prismaService.user.create({
        data: {
          ...signUpDto,
          password: hashedPassword,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = user;

      await this.handleSuccessfulAuth(rest, res, 201);
    } catch (error) {
      this.handleAuthError(error, 'sign up user');
    }
  }

  async signIn(user: Partial<User>, res: Response) {
    try {
      await this.handleSuccessfulAuth(user, res);
    } catch (error) {
      this.handleAuthError(error, 'sign in user');
    }
  }

  async refresh(req: Request, res: Response) {
    const user = req.user as Partial<User>;
    const refreshTokenFromCookie = (req.cookies as { refreshToken: string })[
      'refreshToken'
    ];

    try {
      const existingRefreshToken =
        await this.prismaService.refreshToken.findUnique({
          where: { userId: user.id },
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

      const payload = this.createAuthPayload(user) as AuthPayload;
      const accessToken = this.getToken(payload, 'access');

      res.json({ accessToken });
    } catch (error) {
      this.handleAuthError(error, 'refresh token');
    }
  }

  async signOut(user: Partial<User>, res: Response) {
    try {
      await this.prismaService.refreshToken.delete({
        where: { userId: user.id },
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh',
      });
      res.sendStatus(200);
    } catch (error) {
      this.handleAuthError(error, 'sign out user');
    }
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) return null;
    if (!user.password) return null;

    const isCorrectPassword = await bcrypt.compare(pass, user.password);

    if (!isCorrectPassword) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return rest;
  }

  async validateClient(client: Socket & { user: any }) {
    const rawCookie = client.handshake.headers.cookie;

    if (!rawCookie) {
      throw new UnauthorizedException('No cookies found');
    }

    const cookies = cookie.parse(rawCookie);
    const sessionToken = cookies.__session;

    if (!sessionToken) {
      throw new UnauthorizedException('No Clerk session token found');
    }

    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    client.user = payload;
  }
}
