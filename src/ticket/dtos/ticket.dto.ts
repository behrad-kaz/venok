import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus, TicketPriority, TicketCategory } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ description: 'عنوان تیکت', example: 'مشکل در ورود به سیستم' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان نباید خالی باشد' })
  @MaxLength(200, { message: 'عنوان حداکثر ۲۰۰ کاراکتر باید باشد' })
  title: string;

  @ApiProperty({ description: 'توضیحات تیکت', example: 'من نمی‌توانم وارد حساب کاربری خود شوم...' })
  @IsString()
  @IsNotEmpty({ message: 'توضیحات نباید خالی باشد' })
  description: string;

  @ApiPropertyOptional({
    description: 'دسته‌بندی تیکت',
    enum: TicketCategory,
    default: TicketCategory.GENERAL,
  })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({
    description: 'اولویت تیکت',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'عنوان تیکت' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'توضیحات تیکت' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'وضعیت تیکت',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'اولویت تیکت',
    enum: TicketPriority,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'دسته‌بندی تیکت',
    enum: TicketCategory,
  })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ description: 'شناسه ادمین مسئول' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  assignedTo?: number;
}

export class TicketResponseDto {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  userId: number;
  assignedTo?: number;
  resolvedAt?: Date;
  messagesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}