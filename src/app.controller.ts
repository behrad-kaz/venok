// src/app.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiConsumes, ApiBody, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { deleteImage, saveImage } from './shared/utils/file-utils';
import { UploadedFileDto } from './shared/dtos/uploaded-file.dto';
import { UploadedFilesDto } from './shared/dtos/uploaded-files.dto';
import { DeleteFileDto } from './shared/dtos/delete-file.dto';
import { ImagesPipe } from './shared/pips/images.pipe';
import { Public } from './shared/decorators/public.decorator';

@ApiTags('upload')
@Controller('upload')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('file')
  @Public() // ✅ مسیر عمومی
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'فایل برای آپلود',
        },
        folder: {
          type: 'string',
          description: 'نام پوشه برای ذخیره فایل (اختیاری)',
          example: 'profile-pictures',
        },
        width: {
          type: 'number',
          description: 'عرض تصویر برای ریسایز (اختیاری)',
          example: 500,
          minimum: 1,
        },
        height: {
          type: 'number',
          description: 'ارتفاع تصویر برای ریسایز (اختیاری)',
          example: 500,
          minimum: 1,
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadedFileDto,
  ) {
    try {
      console.log('📤 درخواست آپلود فایل:', {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        folder: body.folder,
      });
      
      const result = await saveImage(file, body);
      console.log('✅ فایل با موفقیت ذخیره شد:', result);
      return result;
      
    } catch (error) {
      console.error('❌ خطا در آپلود فایل:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'خطا در آپلود فایل',
          error: error.stack,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('files')
  @Public()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'فایل‌ها برای آپلود',
        },
        folder: {
          type: 'string',
          description: 'نام پوشه برای ذخیره فایل (اختیاری)',
          example: 'profile-pictures',
        },
        width: {
          type: 'number',
          description: 'عرض تصویر برای ریسایز (اختیاری)',
          example: 500,
          minimum: 1,
        },
        height: {
          type: 'number',
          description: 'ارتفاع تصویر برای ریسایز (اختیاری)',
          example: 500,
          minimum: 1,
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles(
      new ImagesPipe({
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxCount: 5,
      }),
    )
    files: Express.Multer.File[],
    @Body() body: UploadedFilesDto,
  ) {
    try {
      const results = await Promise.all(
        files.map((file) => saveImage(file, body)),
      );
      return {
        success: true,
        count: files.length,
        files: results,
      };
    } catch (error) {
      console.error('❌ خطا در آپلود فایل‌ها:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'خطا در آپلود فایل‌ها',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('file')
  @Public()
  @ApiBody({ type: DeleteFileDto })
  deleteFile(@Body() body: DeleteFileDto) {
    return deleteImage(body.fileName, body.folder);
  }
}