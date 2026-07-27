import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum OrganizationSort {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class OrganizationQueryDto {
  @ApiPropertyOptional({ description: 'شماره صفحه', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'تعداد آیتم در هر صفحه', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'جستجو بر اساس نام' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'جستجو بر اساس اسلاگ' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس', enum: OrganizationSort })
  @IsOptional()
  @IsEnum(OrganizationSort)
  sort?: OrganizationSort = OrganizationSort.CREATED_AT;

  @ApiPropertyOptional({ description: 'ترتیب (ASC یا DESC)', default: 'DESC' })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}