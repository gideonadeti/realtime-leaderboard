import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
// import { Socket } from 'socket.io';
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
  ) {}

  private logger = new Logger(AuthService.name);

  private handleSuccessfulAuth(
    player: Partial<Player>,
    res: Response,
    statusCode: number = 200,
  ) {
    const payload = this.createAuthPayload(player) as AuthPayload;
    const accessToken = this.jwtService.sign(payload);

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
    return {
      username: player.username,
      sub: player.id,
      jti: uuidv4(),
      role: player.role,
    };
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

      this.handleSuccessfulAuth(rest, res, 201);
    } catch (error) {
      this.handleError(error, 'sign up user');
    }
  }

  signIn(player: Partial<Player>, res: Response) {
    try {
      this.handleSuccessfulAuth(player, res);
    } catch (error) {
      this.handleError(error, 'sign in user');
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

  async deleteAccount(playerId: string, res: Response) {
    try {
      await this.prismaService.player.delete({
        where: { id: playerId },
      });

      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      this.handleError(error, 'delete account');
    }
  }
}
