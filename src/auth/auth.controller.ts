import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Public } from './auth.guard';

class SignInDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn({
      email: signInDto.email,
      password: signInDto.password,
    });
  }
}
