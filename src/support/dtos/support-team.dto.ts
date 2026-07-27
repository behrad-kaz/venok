import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsHexColor,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportTeamDto {
  @ApiProperty({ description: 'نام دپارتمان', example: 'پشتیبانی' })
  @IsString()
  @IsNotEmpty({ message: 'نام نباید خالی باشد' })
  @MaxLength(200, { message: 'نام حداکثر ۲۰۰ کاراکتر باید باشد' })
  name: string;

  @ApiPropertyOptional({ description: 'توضیحات', example: 'دپارتمان پشتیبانی عمومی' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'رنگ', example: '#59D8C3' })
  @IsOptional()
  @IsHexColor({ message: 'رنگ باید به صورت هگز باشد' })
  color?: string;

  @ApiPropertyOptional({ description: 'فعال بودن', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSupportTeamDto {
  @ApiPropertyOptional({ description: 'نام دپارتمان' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'توضیحات' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'رنگ' })
  @IsOptional()
  @IsHexColor({ message: 'رنگ باید به صورت هگز باشد' })
  color?: string;

  @ApiPropertyOptional({ description: 'فعال بودن' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SupportTeamResponseDto {
  id: number; // ← تغییر به number
  workspaceId: number;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  memberCount?: number;
  managerName?: string | null;
  openConversations?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}