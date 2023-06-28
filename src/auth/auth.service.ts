import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user?.password !== password) {
      throw new UnauthorizedException();
    }
    const payload = { email: user.email, sub: user.userId };
    return {
      access_token: await this.jwtService.sign(payload),
    };
  }
}
