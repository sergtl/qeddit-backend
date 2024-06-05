import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prismaService.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        hashedPassword: createUserDto.password,
      },
    });
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  findOne(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  findOneById(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  findOneByUsername(username: string) {
    return this.prismaService.user.findUnique({ where: { username } });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  updateRefreshToken(id: string, refreshToken: string) {
    return this.prismaService.user.update({
      where: { id },
      data: {
        refreshToken,
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
