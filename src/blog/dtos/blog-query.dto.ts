import { IsEnum, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum sort {
  Title = 'title',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export class BlogQueryDto {
  @ApiPropertyOptional({ description: 'شماره صفحه', default: 1 })
  @IsPositive()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'تعداد آیتم در هر صفحه', default: 10 })
  @IsPositive()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'جستجو بر اساس عنوان' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'جستجو بر اساس url' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ 
    description: 'مرتب‌سازی بر اساس: title, createdAt, updatedAt',
    enum: sort,
    default: sort.CreatedAt,
    type: 'string', 
  })
  @IsOptional()
  @IsEnum(sort)
  sort?: sort;

  @ApiPropertyOptional({ 
    description: 'ترتیب مرتب‌سازی (ASC یا DESC)',
    default: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}