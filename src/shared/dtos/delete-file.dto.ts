import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteFileDto {
  @ApiProperty({
    description: 'نام فایل برای حذف',
    
  })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiPropertyOptional({
    description: 'پوشه فایل (اختیاری)',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}