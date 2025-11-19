import { ApiBody } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Player } from '@prisma/client';

import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserId } from 'src/user-id/user-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto, @Res() res: Response) {
    return this.authService.signUp(signUpDto, res);
  }

  // Explicitly define request body schema for Swagger, since @Body() isn't used due to LocalAuthGuard extracting credentials
  @ApiBody({ type: SignInDto })
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  signIn(
    @Req() req: Request & { user: Partial<Player> },
    @Res() res: Response,
  ) {
    return this.authService.signIn(req.user, res);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(@UserId() userId: string, @Res() res: Response) {
    return this.authService.deleteAccount(userId, res);
  }
}
