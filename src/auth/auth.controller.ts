import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dtos/user.dto';
import { UserDto } from '../user/dtos/user.dto';
import { Public } from '../shared/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'ورود کاربر' })
  @ApiResponse({ status: 200, description: 'ورود موفق' })
  @ApiResponse({ status: 401, description: 'اطلاعات ورود نادرست' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'ثبت‌نام کاربر جدید' })
  @ApiResponse({ status: 201, description: 'ثبت‌نام موفق' })
  @ApiResponse({ status: 400, description: 'اطلاعات نامعتبر' })
  async register(@Body() userDto: UserDto) {
    return this.authService.register(userDto);
  }
}