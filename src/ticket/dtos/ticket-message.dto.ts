import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketMessageDto {
  @ApiProperty({ description: 'متن پیام', example: 'سلام، مشکل من هنوز حل نشده است...' })
  @IsString()
  @IsNotEmpty({ message: 'متن پیام نباید خالی باشد' })
  content: string;
}

export class UpdateTicketMessageDto {
  @ApiPropertyOptional({ description: 'متن پیام' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'خوانده شده' })
  @IsOptional()
  isRead?: boolean;
}

export class TicketMessageResponseDto {
  id: number;
  content: string;
  type: string;
  userId: number;
  ticketId: number;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}