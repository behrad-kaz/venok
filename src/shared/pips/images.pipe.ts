import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

export interface ImagesPipeOptions {
  maxSize?: number;
  allowedTypes?: string[] | RegExp;
  maxCount?: number;
}

@Injectable()
export class ImagesPipe implements PipeTransform {
  private readonly defaultOptions: ImagesPipeOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxCount: 10,
  };

  private options: ImagesPipeOptions;

  constructor(options: ImagesPipeOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  transform(
    files: Array<Express.Multer.File> | Express.Multer.File,
    metadata: ArgumentMetadata,
  ) {
    // اگر هیچ فایلی ارسال نشده باشد
    if (!files) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'No files uploaded',
        error: 'Bad Request',
      });
    }

    // اگر یک فایل ارسال شده، به آرایه تبدیل کن
    const fileArray = Array.isArray(files) ? files : [files];

    // بررسی تعداد فایل‌ها
    if (fileArray.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (fileArray.length > (this.options.maxCount || 10)) {
      throw new BadRequestException(
        `Maximum ${this.options.maxCount} files allowed`,
      );
    }

    // اعتبارسنجی هر فایل
    const errors: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const index = i + 1;

      // بررسی حجم فایل
      if (file.size > (this.options.maxSize || 10 * 1024 * 1024)) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (
          (this.options.maxSize || 10 * 1024 * 1024) /
          (1024 * 1024)
        ).toFixed(1);
        errors.push(
          `File ${index}: Size ${sizeMB}MB exceeds maximum ${maxSizeMB}MB`,
        );
      }

      // بررسی نوع فایل
      const allowedTypes = this.options.allowedTypes || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      if (Array.isArray(allowedTypes)) {
        // اگر آرایه است
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(
            `File ${index}: Invalid type "${file.mimetype}". Allowed: ${allowedTypes.join(', ')}`,
          );
        }
      } else if (allowedTypes instanceof RegExp) {
        // اگر Regex است
        if (!allowedTypes.test(file.mimetype)) {
          errors.push(`File ${index}: Invalid type "${file.mimetype}"`);
        }
      }

      // بررسی نام فایل
      if (!file.originalname) {
        errors.push(`File ${index}: Missing file name`);
      }

      // بررسی پسوند
      const ext = file.originalname?.split('.').pop()?.toLowerCase();
      const allowedExts = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
      if (ext && !allowedExts.includes(ext)) {
        errors.push(
          `File ${index}: Invalid extension ".${ext}". Allowed: ${allowedExts.join(', ')}`,
        );
      }
    }

    // اگر خطایی وجود داشت، همه را به صورت یکجا برگردان
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'File validation failed',
        errors: errors,
        error: 'Bad Request',
      });
    }

    return Array.isArray(files) ? fileArray : fileArray[0];
  }
}
