import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class UrlPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // اگر مقدار وجود نداشت، آن را به حالت اولیه برگردان
    if (!value) {
      return value;
    }

    // فقط برای پارامترهای 'url' در body یا query
    if (metadata.type === 'body' || metadata.type === 'query') {
      const url = value;

      // بررسی اینکه مقدار string است
      if (typeof url !== 'string') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'URL must be a string',
          error: 'Bad Request',
        });
      }

      // بررسی اینکه فقط شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد
      const urlPattern = /^[a-z0-9-]+$/;
      if (!urlPattern.test(url)) {
        throw new BadRequestException({
          statusCode: 400,
          message: `Invalid URL format: "${url}". URL must only contain lowercase letters, numbers, and hyphens (-).`,
          error: 'Bad Request',
          received: url,
        });
      }

      // بررسی اینکه با خط تیره شروع یا ختم نشود
      if (url.startsWith('-') || url.endsWith('-')) {
        throw new BadRequestException({
          statusCode: 400,
          message: `Invalid URL format: "${url}". URL cannot start or end with a hyphen (-).`,
          error: 'Bad Request',
          received: url,
        });
      }

      // بررسی اینکه خط تیره‌های تکراری نداشته باشد
      if (url.includes('--')) {
        throw new BadRequestException({
          statusCode: 400,
          message: `Invalid URL format: "${url}". URL cannot contain consecutive hyphens (--).`,
          error: 'Bad Request',
          received: url,
        });
      }

      // بررسی حداقل و حداکثر طول
      if (url.length < 3) {
        throw new BadRequestException({
          statusCode: 400,
          message: `Invalid URL format: "${url}". URL must be at least 3 characters long.`,
          error: 'Bad Request',
          received: url,
          minLength: 3,
        });
      }

      if (url.length > 100) {
        throw new BadRequestException({
          statusCode: 400,
          message: `Invalid URL format: "${url}". URL must be at most 100 characters long.`,
          error: 'Bad Request',
          received: url,
          maxLength: 100,
        });
      }

      // تبدیل به حروف کوچک (در صورت نیاز)
      return url.toLowerCase();
    }

    return value;
  }
}