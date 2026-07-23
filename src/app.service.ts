import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  uploadFile(file: Express.Multer.File) {
    return {
      message: 'File uploaded successfully',
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}