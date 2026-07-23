import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UploadedFilesDto {
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