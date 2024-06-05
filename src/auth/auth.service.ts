import * as argon from 'argon2';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthEntity } from './entity/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async signTokens(userId: string, email: string): Promise<AuthEntity> {
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    return {
      refreshToken,
      accessToken,
    };
  }

  private async updateRefreshTokens(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon.hash(refreshToken);

    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  async resetTokens(userId: string, refreshToken: string): Promise<AuthEntity> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const refreshTokenMatches = await argon.verify(
      user.refreshToken,
      refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.signTokens(user.id, user.email);

    await this.updateRefreshTokens(user.id, tokens.refreshToken);

    return tokens;
  }

  async login(email: string, password: string): Promise<AuthEntity> {
    const user = await this.usersService.findOne(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await argon.verify(user.hashedPassword, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const tokens = await this.signTokens(user.id, user.email);

    await this.updateRefreshTokens(user.id, tokens.refreshToken);

    return tokens;
  }

  async register(username: string, email: string, password: string) {
    let user;

    user = await this.usersService.findOneByUsername(username);

    if (user) {
      throw new BadRequestException('User already exists');
    }

    user = await this.usersService.findOne(email);

    if (user) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await argon.hash(password);

    user = await this.usersService.create({
      username,
      email,
      password: hashedPassword,
    });

    const tokens = await this.signTokens(user.id, user.email);

    await this.updateRefreshTokens(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }
}
