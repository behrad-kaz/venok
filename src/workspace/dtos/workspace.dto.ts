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
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WorkspaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class WorkingDaysDto {
  @IsOptional()
  @IsBoolean()
  saturday?: boolean;

  @IsOptional()
  @IsBoolean()
  sunday?: boolean;

  @IsOptional()
  @IsBoolean()
  monday?: boolean;

  @IsOptional()
  @IsBoolean()
  tuesday?: boolean;

  @IsOptional()
  @IsBoolean()
  wednesday?: boolean;

  @IsOptional()
  @IsBoolean()
  thursday?: boolean;

  @IsOptional()
  @IsBoolean()
  friday?: boolean;
}

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'نام workspace', example: 'دفتر مرکزی' })
  @IsString()
  @IsNotEmpty({ message: 'نام نباید خالی باشد' })
  @MaxLength(200, { message: 'نام حداکثر ۲۰۰ کاراکتر باید باشد' })
  name: string;

  @ApiProperty({ description: 'کد workspace', example: 'HQ-001' })
  @IsString()
  @IsNotEmpty({ message: 'کد نباید خالی باشد' })
  @MaxLength(50, { message: 'کد حداکثر ۵۰ کاراکتر باید باشد' })
  code: string;

  @ApiProperty({ description: 'اسلاگ (URL)', example: 'main-office' })
  @IsString()
  @IsNotEmpty({ message: 'اسلاگ نباید خالی باشد' })
  @MaxLength(100, { message: 'اسلاگ حداکثر ۱۰۰ کاراکتر باید باشد' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'اسلاگ فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد',
  })
  slug: string;

  @ApiPropertyOptional({ description: 'شناسه مدیر staff', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  managerStaffId?: number;

  // ============ اطلاعات شرکت ============
  @ApiPropertyOptional({ description: 'شماره تماس', example: '02112345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'ایمیل', example: 'info@workspace.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'لوگو', example: '/files/workspaces-logo/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  // ============ اطلاعات پشتیبانی ============
  @ApiPropertyOptional({ description: 'شماره تماس پشتیبانی', example: '02112345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  supportPhone?: string;

  @ApiPropertyOptional({ description: 'ایمیل پشتیبانی', example: 'support@workspace.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supportEmail?: string;

  @ApiPropertyOptional({ description: 'شماره همراه اصلی برای هشدارهای مدیریتی', example: '09123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alertPhone?: string;

  @ApiPropertyOptional({ description: 'متن کوتاه معرفی پشتیبانی' })
  @IsOptional()
  @IsString()
  introText?: string;

  // ============ ساعات کاری ============
  @ApiPropertyOptional({ description: 'روزهای کاری' })
  @IsOptional()
  @IsObject()
  workingDays?: WorkingDaysDto;

  @ApiPropertyOptional({ description: 'ساعت شروع پاسخگویی', example: '09:00' })
  @IsOptional()
  @IsString()
  workStartTime?: string;

  @ApiPropertyOptional({ description: 'ساعت پایان پاسخگویی', example: '18:00' })
  @IsOptional()
  @IsString()
  workEndTime?: string;

  @ApiPropertyOptional({ description: 'پیام عمومی خارج از ساعات کاری' })
  @IsOptional()
  @IsString()
  outOfHoursMessage?: string;

  // ============ اعلان‌ها ============
  @ApiPropertyOptional({ description: 'ارسال پیامک لینک گفتگو', default: true })
  @IsOptional()
  @IsBoolean()
  sendLinkSms?: boolean;

  @ApiPropertyOptional({ description: 'ارسال OTP برای تغییر رمز', default: true })
  @IsOptional()
  @IsBoolean()
  sendOtpForPasswordChange?: boolean;

  @ApiPropertyOptional({ description: 'اطلاع‌رسانی گفتگوهای بدون پاسخ به مدیرکل', default: true })
  @IsOptional()
  @IsBoolean()
  notifyManagerForUnanswered?: boolean;

  @ApiPropertyOptional({ description: 'اعلان گفتگوهای جدید', default: true })
  @IsOptional()
  @IsBoolean()
  notifyNewConversations?: boolean;

  // ============ امنیت ============
  @ApiPropertyOptional({ description: 'الزام رمز قوی برای اعضا', default: true })
  @IsOptional()
  @IsBoolean()
  requireStrongPassword?: boolean;

  @ApiPropertyOptional({ description: 'فعال‌سازی تایید شماره همراه برای تغییر رمز', default: true })
  @IsOptional()
  @IsBoolean()
  requirePhoneVerificationForPasswordChange?: boolean;

  @ApiPropertyOptional({ description: 'خروج خودکار بعد از مدت مشخص (دقیقه)', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoLogoutMinutes?: number;

  // ============ فیلدهای حذف شده ============
  // address, city, postalCode, latitude, longitude - حذف شدند

  @ApiPropertyOptional({ description: 'منطقه زمانی', default: 'Asia/Tehran' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ description: 'منطقه', default: 'fa-IR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ description: 'نام workspace' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'کد workspace' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'اسلاگ (URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'اسلاگ فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'وضعیت', enum: WorkspaceStatus })
  @IsOptional()
  @IsEnum(WorkspaceStatus)
  status?: WorkspaceStatus;

  @ApiPropertyOptional({ description: 'شناسه مدیر staff' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  managerStaffId?: number;

  // ============ اطلاعات شرکت ============
  @ApiPropertyOptional({ description: 'شماره تماس' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'ایمیل' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'لوگو' })
  @IsOptional()
  @IsString()
  logo?: string;

  // ============ اطلاعات پشتیبانی ============
  @ApiPropertyOptional({ description: 'شماره تماس پشتیبانی' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  supportPhone?: string;

  @ApiPropertyOptional({ description: 'ایمیل پشتیبانی' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supportEmail?: string;

  @ApiPropertyOptional({ description: 'شماره همراه اصلی برای هشدارهای مدیریتی' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alertPhone?: string;

  @ApiPropertyOptional({ description: 'متن کوتاه معرفی پشتیبانی' })
  @IsOptional()
  @IsString()
  introText?: string;

  // ============ ساعات کاری ============
  @ApiPropertyOptional({ description: 'روزهای کاری' })
  @IsOptional()
  @IsObject()
  workingDays?: WorkingDaysDto;

  @ApiPropertyOptional({ description: 'ساعت شروع پاسخگویی' })
  @IsOptional()
  @IsString()
  workStartTime?: string;

  @ApiPropertyOptional({ description: 'ساعت پایان پاسخگویی' })
  @IsOptional()
  @IsString()
  workEndTime?: string;

  @ApiPropertyOptional({ description: 'پیام عمومی خارج از ساعات کاری' })
  @IsOptional()
  @IsString()
  outOfHoursMessage?: string;

  // ============ اعلان‌ها ============
  @ApiPropertyOptional({ description: 'ارسال پیامک لینک گفتگو' })
  @IsOptional()
  @IsBoolean()
  sendLinkSms?: boolean;

  @ApiPropertyOptional({ description: 'ارسال OTP برای تغییر رمز' })
  @IsOptional()
  @IsBoolean()
  sendOtpForPasswordChange?: boolean;

  @ApiPropertyOptional({ description: 'اطلاع‌رسانی گفتگوهای بدون پاسخ به مدیرکل' })
  @IsOptional()
  @IsBoolean()
  notifyManagerForUnanswered?: boolean;

  @ApiPropertyOptional({ description: 'اعلان گفتگوهای جدید' })
  @IsOptional()
  @IsBoolean()
  notifyNewConversations?: boolean;

  // ============ امنیت ============
  @ApiPropertyOptional({ description: 'الزام رمز قوی برای اعضا' })
  @IsOptional()
  @IsBoolean()
  requireStrongPassword?: boolean;

  @ApiPropertyOptional({ description: 'فعال‌سازی تایید شماره همراه برای تغییر رمز' })
  @IsOptional()
  @IsBoolean()
  requirePhoneVerificationForPasswordChange?: boolean;

  @ApiPropertyOptional({ description: 'خروج خودکار بعد از مدت مشخص (دقیقه)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoLogoutMinutes?: number;

  // ============ فیلدهای حذف شده ============
  // address, city, postalCode, latitude, longitude - حذف شدند

  @ApiPropertyOptional({ description: 'منطقه زمانی' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ description: 'منطقه' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

export class WorkspaceResponseDto {
  id: number;
  organizationId: number;
  managerStaffId: number;
  name: string;
  code: string;
  slug: string;
  status: string;

  // اطلاعات شرکت
  phone: string | null;
  email: string | null;
  logo: string | null;

  // اطلاعات پشتیبانی
  supportPhone: string | null;
  supportEmail: string | null;
  alertPhone: string | null;
  introText: string | null;

  // ساعات کاری
  workingDays: {
    saturday: boolean;
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
  };
  workStartTime: string;
  workEndTime: string;
  outOfHoursMessage: string | null;

  // اعلان‌ها
  sendLinkSms: boolean;
  sendOtpForPasswordChange: boolean;
  notifyManagerForUnanswered: boolean;
  notifyNewConversations: boolean;

  // امنیت
  requireStrongPassword: boolean;
  requirePhoneVerificationForPasswordChange: boolean;
  autoLogoutMinutes: number;

  timezone: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}