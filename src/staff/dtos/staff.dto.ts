// ============================================================
// FILE: src/staff/dtos/staff.dto.ts
// ============================================================
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
  Matches,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffStatus, StaffRole } from '../entities/staff.entity';

export class CreateStaffDto {
  @ApiProperty({ description: 'نام کارمند', example: 'علی محمدی' })
  @IsString()
  @IsNotEmpty({ message: 'نام نباید خالی باشد' })
  @MaxLength(200, { message: 'نام حداکثر ۲۰۰ کاراکتر باید باشد' })
  name: string;

  @ApiProperty({ description: 'کد کارمند', example: 'EMP-001' })
  @IsString()
  @IsNotEmpty({ message: 'کد نباید خالی باشد' })
  @MaxLength(50, { message: 'کد حداکثر ۵۰ کاراکتر باید باشد' })
  code: string;

  @ApiProperty({ description: 'شماره تماس (برای ورود)', example: '09123456789' })
  @IsString()
  @IsNotEmpty({ message: 'شماره تماس نباید خالی باشد' })
  @MaxLength(20)
  @Matches(/^09[0-9]{9}$/, { message: 'شماره تماس نامعتبر است' })
  phone: string;

  @ApiProperty({ description: 'رمز عبور اولیه (حداقل ۸ کاراکتر)', example: '12345678' })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور نباید خالی باشد' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر باید باشد' })
  password: string;

  @ApiPropertyOptional({ description: 'ایمیل', example: 'ali@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ 
    description: 'شناسه دپارتمان', 
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({ description: 'نقش کاربر', enum: StaffRole, default: StaffRole.STAFF })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @ApiPropertyOptional({ description: 'فعال بودن', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ description: 'نام کارمند' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'کد کارمند' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'وضعیت', enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional({ description: 'نقش', enum: StaffRole })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @ApiPropertyOptional({ 
    description: 'شناسه دپارتمان',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({ description: 'شماره تماس' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^09[0-9]{9}$/, { message: 'شماره تماس نامعتبر است' })
  phone?: string;

  @ApiPropertyOptional({ description: 'رمز عبور جدید (اختیاری - برای تغییر)' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر باید باشد' })
  password?: string;

  @ApiPropertyOptional({ description: 'ایمیل' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'فعال بودن' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'آخرین آنلاین بودن' })
  @IsOptional()
  lastOnlineAt?: Date;
}
// ============================================================