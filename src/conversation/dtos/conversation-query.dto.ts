import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus, ConversationPriority } from '../entities/conversation.entity';

export enum ConversationSort {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  START_DATE = 'startDate',
}

export class ConversationQueryDto {
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

  @ApiPropertyOptional({ description: 'جستجو بر اساس نام مشتری' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'جستجو بر اساس شماره تماس' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'جستجو بر اساس موضوع' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس وضعیت', enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس اولویت', enum: ConversationPriority })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس دپارتمان' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  teamId?: number;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس اپراتور' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس', enum: ConversationSort })
  @IsOptional()
  @IsEnum(ConversationSort)
  sort?: ConversationSort = ConversationSort.CREATED_AT;

  @ApiPropertyOptional({ description: 'ترتیب (ASC یا DESC)', default: 'DESC' })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}