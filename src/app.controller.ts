import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Body,
  Delete,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiConsumes, ApiBody, ApiTags, ApiSecurity } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { deleteImage, saveImage } from './shared/utils/file-utils';
import { UploadedFileDto } from './shared/dtos/uploaded-file.dto';
import { UploadedFilesDto } from './shared/dtos/uploaded-files.dto';
import { DeleteFileDto } from './shared/dtos/delete-file.dto';
import { ImagesPipe } from './shared/pips/images.pipe';

@ApiTags('upload')
@ApiSecurity('apiKey')
@Controller('upload')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('file')
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
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }),
          new FileTypeValidator({ fileType: /(png|jpeg|jpg|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadedFileDto,
  ) {
    return saveImage(file, body);
  }

  @Post('files')
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
    const results = await Promise.all(
      files.map((file) => saveImage(file, body)),
    );
    return {
      success: true,
      count: files.length,
      files: results,
    };
  }

  @Delete('file')
  @ApiBody({ type: DeleteFileDto })
  deleteFile(@Body() body: DeleteFileDto) {
    return deleteImage(body.fileName, body.folder);
  }
}
