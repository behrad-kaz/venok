import { ArgumentsHost, Catch, ExceptionFilter, HttpException, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { LogService } from '../services/log.service';


@Catch(HttpException)
export class LogFilter implements ExceptionFilter {
  constructor(
    @Inject(LogService)
    private readonly logService: LogService,
  ) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const status = exception.getStatus();
    let message = exception.message;

    // مدیریت اختصاصی برای خطاهای خاص
    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse() as any;
      if (exceptionResponse.message) {
        message = Array.isArray(exceptionResponse.message) 
          ? exceptionResponse.message.join(', ') 
          : exceptionResponse.message;
      }
    }

    if (exception instanceof NotFoundException) {
      message = 'منبع مورد نظر یافت نشد';
    }

    // ذخیره خطا در دیتابیس
    try {
      await this.logService.createErrorLog(
        exception,
        request.url,
        request.method,
        status,
        {
          body: request.body,
          query: request.query,
          params: request.params,
        }
      );
    } catch (logError) {
      console.error('Error saving log to database:', logError);
    }

    console.error(`[${new Date().toISOString()}] ❌ ${request.method} ${request.url} - ${status}: ${message}`);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: exception.stack,
        name: exception.name,
      }),
    };

    response.status(status).json(errorResponse);
  }
}