import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() { email, password }: LoginDto) {
    return this.authService.login(email, password);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  refresh(@Req() req: Request) {
    return this.authService.resetTokens(
      req.user['sub'],
      req.user['refreshToken'],
    );
  }

  logout() {}

  @Post('register')
  register(@Body() { username, email, password }: RegisterDto) {
    return this.authService.register(username, email, password);
  }
}
