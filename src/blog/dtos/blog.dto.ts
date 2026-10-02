import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlogDto {
  @ApiProperty({ description: 'عنوان مطلب' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان نباید خالی باشد' })
  title: string;

  @ApiProperty({ description: 'محتوی مطلب' })
  @IsString()
  @IsNotEmpty({ message: 'محتوا نباید خالی باشد' })
  content: string;

  @ApiProperty({ 
    description: 'URL مطلب (فقط حروف انگلیسی کوچک، اعداد و -)',
    example: 'my-first-blog-post',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty({ message: 'url نباید خالی باشد' })
  @Matches(/^[a-z0-9-]+$/, { 
    message: 'URL فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد' 
  })
  url: string;

  @ApiPropertyOptional({ description: 'عکس مطلب (اختیاری)' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ 
    description: 'شناسه دسته‌بندی (اختیاری)',
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  categoryId?: number;
}