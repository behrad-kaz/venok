import { IsOptional, IsString, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus, TicketPriority, TicketCategory } from '../entities/ticket.entity';

export enum TicketSort {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STATUS = 'status',
  PRIORITY = 'priority',
}

export class TicketQueryDto {
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

  @ApiPropertyOptional({ description: 'جستجو بر اساس عنوان' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس وضعیت', enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس اولویت', enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس دسته‌بندی', enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس کاربر' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس تیکت‌های اختصاص داده شده به ادمین' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  assignedTo?: number;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس تیکت‌های حل شده' })
  @IsOptional()
  @IsBoolean()
  isResolved?: boolean;

  @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس', enum: TicketSort })
  @IsOptional()
  @IsEnum(TicketSort)
  sort?: TicketSort = TicketSort.CREATED_AT;

  @ApiPropertyOptional({ description: 'ترتیب (ASC یا DESC)', default: 'DESC' })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}