import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class IdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // فقط برای پارامترهای 'id' در مسیر
    if (metadata.type === 'param' && metadata.data === 'id') {
      // بررسی وجود مقدار
      if (!value) {
        throw new BadRequestException('ID parameter is required');
      }

      // اگر مقدار از قبل عدد است، به string تبدیل کن
      const stringValue = typeof value === 'number' ? String(value) : value;

      // بررسی نوع
      if (typeof stringValue !== 'string') {
        throw new BadRequestException('ID must be a string');
      }

      // تبدیل به عدد
      const numericId = parseInt(stringValue, 10);
      
      // بررسی عدد بودن
      if (isNaN(numericId)) {
        throw new BadRequestException(`Invalid ID format: "${stringValue}". ID must be a valid number.`);
      }

      // بررسی مثبت بودن
      if (numericId <= 0) {
        throw new BadRequestException(`Invalid ID format: "${stringValue}". ID must be a positive integer.`);
      }

      // برگرداندن به صورت عدد
      return numericId;
    }

    return value;
  }
}