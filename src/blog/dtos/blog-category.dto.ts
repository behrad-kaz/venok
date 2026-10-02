import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlogCategoryDto {
  @ApiProperty({ description: 'عنوان دسته‌بندی' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان نباید خالی باشد' })
  title: string;

  @ApiProperty({ description: 'توضیحات دسته‌بندی' })
  @IsString()
  @IsNotEmpty({ message: 'توضیحات نباید خالی باشد' })
  description: string;

  @ApiProperty({ 
    description: 'URL دسته‌بندی (فقط حروف انگلیسی کوچک، اعداد و -)',
    example: 'programming-tutorials',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty({ message: 'url نباید خالی باشد' })
  @Matches(/^[a-z0-9-]+$/, { 
    message: 'URL فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد' 
  })
  url: string;

  @ApiPropertyOptional({ description: 'عکس دسته‌بندی (اختیاری)' })
  @IsOptional()
  @IsString()
  image?: string | null;
}