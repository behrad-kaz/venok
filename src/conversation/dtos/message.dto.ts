import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'محتوی پیام', example: 'سلام، مشکل من هنوز حل نشده است' })
  @IsString()
  @IsNotEmpty({ message: 'محتوی پیام نباید خالی باشد' })
  content: string;

  @ApiPropertyOptional({ description: 'یادداشت داخلی', default: false })
  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'محتوی پیام' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'خوانده شده' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class MessageResponseDto {
  id: number;
  conversationId: number;
  senderType: string;
  senderId: number | null;
  senderName: string;
  content: string;
  isInternalNote: boolean;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sender?: {
    id: number;
    staffName: string;
  };
}