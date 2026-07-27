import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/services/user.service';
import { LoginDto } from '../user/dtos/user.dto';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(mobile: string, password: string): Promise<UserEntity> {
    const user = await this.userService.findByMobile(mobile);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.mobile, loginDto.password);

    await this.userService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId,
      },
    };
  }

  async register(userData: any) {
    const user = await this.userService.create(userData);

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}