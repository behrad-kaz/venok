import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LogService } from '../services/log.service';
import { LogType } from '../schemas/log.entity';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    @Inject(LogService)
    private readonly logService: LogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const timestamp = new Date().toISOString();
    const startTime = Date.now();

    // دریافت userId از توکن
    const user = (request as any).user;
    const userId = user?.id || null;

    console.log(
      `📥 [${timestamp}] ${method} ${url} - ${userAgent} - ${ip} - User: ${userId || 'anonymous'}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;

          console.log(
            `📤 [${timestamp}] ${method} ${url} - ${statusCode} - ${duration}ms`,
          );

          if (statusCode < 400) {
            this.logService
              .createLog(
                `Success: ${method} ${url}`,
                LogType.Info,
                {
                  method,
                  url,
                  statusCode,
                  duration,
                  ip,
                  userAgent,
                  timestamp,
                  hasData: !!data,
                },
                userId, // ← اضافه شد
              )
              .catch((err) => console.error('Error saving log:', err));
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || error.statusCode || 500;

          console.error(
            `❌ [${timestamp}] ${method} ${url} - ${statusCode} - ${duration}ms`,
          );
          console.error(`❌ Error: ${error.message}`);

          if (process.env.NODE_ENV === 'development') {
            console.error(error.stack);
          }

          this.logService
            .createErrorLog(
              error,
              url,
              method,
              statusCode,
              {
                ip,
                userAgent,
                duration,
                timestamp,
                requestBody: request.body,
                requestQuery: request.query,
                requestParams: request.params,
              },
              userId, // ← اضافه شد
            )
            .catch((err) => console.error('Error saving error log:', err));
        },
      }),
    );
  }
}
