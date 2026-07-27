import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus, ConversationPriority, ConversationSource } from '../entities/conversation.entity';

export class CreateConversationDto {
  @ApiProperty({ description: 'نام مشتری', example: 'علی محمدی' })
  @IsString()
  @IsNotEmpty({ message: 'نام مشتری نباید خالی باشد' })
  @MaxLength(200, { message: 'نام حداکثر ۲۰۰ کاراکتر باید باشد' })
  customerName: string;

  @ApiProperty({ description: 'شماره تماس مشتری', example: '09123456789' })
  @IsString()
  @IsNotEmpty({ message: 'شماره تماس نباید خالی باشد' })
  @MaxLength(20, { message: 'شماره تماس حداکثر ۲۰ کاراکتر باید باشد' })
  customerPhone: string;

  @ApiProperty({ description: 'موضوع', example: 'مشکل در پرداخت' })
  @IsString()
  @IsNotEmpty({ message: 'موضوع نباید خالی باشد' })
  @MaxLength(200, { message: 'موضوع حداکثر ۲۰۰ کاراکتر باید باشد' })
  subject: string;

  @ApiPropertyOptional({ description: 'شناسه دپارتمان (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  teamId?: number;

  @ApiPropertyOptional({
    description: 'منبع ورود',
    enum: ConversationSource,
    default: ConversationSource.WIDGET,
  })
  @IsOptional()
  @IsEnum(ConversationSource)
  source?: ConversationSource;

  @ApiPropertyOptional({
    description: 'اولویت',
    enum: ConversationPriority,
    default: ConversationPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'وضعیت', enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'اولویت', enum: ConversationPriority })
  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;

  @ApiPropertyOptional({ description: 'شناسه دپارتمان (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  teamId?: number;

  @ApiPropertyOptional({ description: 'شناسه اپراتور مسئول' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: 'موضوع' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;
}

export class ConversationResponseDto {
  id: number;
  workspaceId: number;
  teamId: string | null;
  agentId: number | null;
  customerName: string;
  customerPhone: string;
  subject: string;
  status: ConversationStatus;
  source: ConversationSource;
  priority: ConversationPriority;
  startDate: Date;
  lastActivity: Date | null;
  closedAt: Date | null;
  messagesCount?: number;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  team?: {
    id: string;
    name: string;
  };
  agent?: {
    id: number;
    name: string;
  };
}