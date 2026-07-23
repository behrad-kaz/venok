import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../shared/decorators/public.decorator';
import { IS_ADMIN_KEY } from '../../shared/decorators/admin.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // بررسی اگر مسیر public است
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // بررسی وجود Authorization header
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid authorization format. Use Bearer token',
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // بررسی اگر خطایی وجود دارد
    if (err || !user) {
      console.error('❌ JWT Error:', err || info?.message || 'User not found');
      throw err || new UnauthorizedException('Invalid or missing token');
    }

    // بررسی نقش ادمین
    const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdmin && user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    console.log('✅ User authenticated:', user.email, 'Role:', user.role);
    return user;
  }
}
