import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StaffStatus } from '../entities/staff.entity';

export enum StaffSort {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class StaffQueryDto {
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

  @ApiPropertyOptional({ description: 'جستجو بر اساس کد' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس وضعیت', enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس', enum: StaffSort })
  @IsOptional()
  @IsEnum(StaffSort)
  sort?: StaffSort = StaffSort.CREATED_AT;

  @ApiPropertyOptional({ description: 'ترتیب (ASC یا DESC)', default: 'DESC' })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}