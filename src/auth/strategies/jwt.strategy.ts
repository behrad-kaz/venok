import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    console.log(
      '🔐 JWT Strategy initialized with secret:',
      secret.substring(0, 10) + '...',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('📦 JWT Payload received:', payload);

    const user = await this.userService.findUserById(payload.sub);
    if (!user) {
      console.error('❌ User not found with ID:', payload.sub);
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      console.error('❌ User account is deactivated:', payload.email);
      throw new UnauthorizedException('Account is deactivated');
    }

    console.log('✅ User validated:', user.mobile, 'Role:', user.role);

    return {
      id: payload.sub,
      email: payload.email,
      mobile: payload.mobile,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      organizationId: user.organizationId,
    };
  }
}