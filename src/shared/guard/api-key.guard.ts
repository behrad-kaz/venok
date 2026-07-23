import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_ADMIN_KEY } from '../decorators/admin.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // بررسی اگر مسیر public است
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['apikey'];
    
    const validApiKey = this.configService.get<string>('API_KEY');
    const adminApiKey = this.configService.get<string>('ADMIN_API_KEY');
    
    // بررسی وجود API Key
    if (!apiKey) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'API key is missing',
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
    }
    
    // بررسی کلید معمولی
    if (apiKey === validApiKey) {
      return true;
    }
    
    // بررسی کلید ادمین
    if (apiKey === adminApiKey) {
      // اگر کلید ادمین است، دسترسی کامل دارد
      return true;
    }
    
    throw new UnauthorizedException({
      statusCode: 401,
      message: 'Invalid API key',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
    });
  }
}