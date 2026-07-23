import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UploadedFileDto {
  @ApiPropertyOptional({
    description: 'نام پوشه برای ذخیره فایل (اختیاری)',
    example: 'profile-pictures',
    default: 'files',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'عرض تصویر برای ریسایز (اختیاری)',
    example: 500,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({
    description: 'ارتفاع تصویر برای ریسایز (اختیاری)',
    example: 500,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;
}