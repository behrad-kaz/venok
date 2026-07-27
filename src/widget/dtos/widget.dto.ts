import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  MaxLength,
  IsHexColor,
  IsIn,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWidgetDto {
  @ApiProperty({ description: 'نام شرکت', example: 'آژانس سفر نمونه' })
  @IsString()
  @IsNotEmpty({ message: 'نام شرکت نباید خالی باشد' })
  @MaxLength(200, { message: 'نام شرکت حداکثر ۲۰۰ کاراکتر باید باشد' })
  companyName: string;

  @ApiPropertyOptional({ description: 'آدرس لوگو', example: '/files/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'رنگ اصلی', default: '#14b8a6' })
  @IsOptional()
  @IsHexColor({ message: 'رنگ باید به صورت هگز باشد' })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'موقعیت دکمه',
    enum: ['bottom-right', 'bottom-left'],
    default: 'bottom-right',
  })
  @IsOptional()
  @IsIn(['bottom-right', 'bottom-left'])
  buttonPosition?: string;

  @ApiPropertyOptional({
    description: 'اندازه دکمه',
    enum: ['sm', 'md', 'lg'],
    default: 'md',
  })
  @IsOptional()
  @IsIn(['sm', 'md', 'lg'])
  buttonSize?: string;

  @ApiPropertyOptional({ description: 'عنوان فرم', default: 'چطور می‌تونیم کمکتون کنیم؟' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formTitle?: string;

  @ApiPropertyOptional({ description: 'توضیحات فرم', default: 'موضوع گفتگو را انتخاب کنید تا شما را به تیم مناسب وصل کنیم.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formDescription?: string;

  @ApiPropertyOptional({ description: 'متن placeholder شماره همراه', default: 'شماره همراه خود را وارد کنید' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phonePlaceholder?: string;

  @ApiPropertyOptional({ description: 'متن دکمه ارسال', default: 'شروع گفتگو' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  submitButtonText?: string;

  @ApiPropertyOptional({ description: 'پیام موفقیت', default: 'لینک گفتگو برای شما پیامک شد.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  successMessage?: string;

  @ApiPropertyOptional({ description: 'متن حریم خصوصی', default: 'با ثبت شماره، لینک گفتگو از طریق پیامک برای شما ارسال می‌شود.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  privacyText?: string;

  @ApiPropertyOptional({ description: 'نمایش انتخاب دپارتمان', default: true })
  @IsOptional()
  @IsBoolean()
  showDepartmentSelect?: boolean;

  @ApiPropertyOptional({ description: 'نمایش فیلد توضیحات', default: true })
  @IsOptional()
  @IsBoolean()
  showDescriptionField?: boolean;

  @ApiPropertyOptional({ description: 'اجباری بودن توضیحات', default: false })
  @IsOptional()
  @IsBoolean()
  descriptionRequired?: boolean;

  @ApiPropertyOptional({ description: 'فعال بودن ویجت', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'دامنه‌های مجاز', example: ['https://example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({ description: 'شناسه دپارتمان‌های پشتیبانی' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  supportTeamIds?: number[];
}

export class UpdateWidgetDto {
  @ApiPropertyOptional({ description: 'نام شرکت' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional({ description: 'آدرس لوگو' })
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @ApiPropertyOptional({ description: 'رنگ اصلی' })
  @IsOptional()
  @IsHexColor({ message: 'رنگ باید به صورت هگز باشد' })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'موقعیت دکمه',
    enum: ['bottom-right', 'bottom-left'],
  })
  @IsOptional()
  @IsIn(['bottom-right', 'bottom-left'])
  buttonPosition?: string;

  @ApiPropertyOptional({
    description: 'اندازه دکمه',
    enum: ['sm', 'md', 'lg'],
  })
  @IsOptional()
  @IsIn(['sm', 'md', 'lg'])
  buttonSize?: string;

  @ApiPropertyOptional({ description: 'عنوان فرم' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formTitle?: string;

  @ApiPropertyOptional({ description: 'توضیحات فرم' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formDescription?: string;

  @ApiPropertyOptional({ description: 'متن placeholder شماره همراه' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phonePlaceholder?: string;

  @ApiPropertyOptional({ description: 'متن دکمه ارسال' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  submitButtonText?: string;

  @ApiPropertyOptional({ description: 'پیام موفقیت' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  successMessage?: string;

  @ApiPropertyOptional({ description: 'متن حریم خصوصی' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  privacyText?: string;

  @ApiPropertyOptional({ description: 'نمایش انتخاب دپارتمان' })
  @IsOptional()
  @IsBoolean()
  showDepartmentSelect?: boolean;

  @ApiPropertyOptional({ description: 'نمایش فیلد توضیحات' })
  @IsOptional()
  @IsBoolean()
  showDescriptionField?: boolean;

  @ApiPropertyOptional({ description: 'اجباری بودن توضیحات' })
  @IsOptional()
  @IsBoolean()
  descriptionRequired?: boolean;

  @ApiPropertyOptional({ description: 'فعال بودن ویجت' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'دامنه‌های مجاز' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({ description: 'شناسه دپارتمان‌های پشتیبانی' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  supportTeamIds?: number[];
}

export class WidgetResponseDto {
  id: number;
  workspaceId: number;
  widgetToken: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  buttonPosition: string;
  buttonSize: string;
  formTitle: string;
  formDescription: string;
  phonePlaceholder: string;
  submitButtonText: string;
  successMessage: string;
  privacyText: string;
  showDepartmentSelect: boolean;
  showDescriptionField: boolean;
  descriptionRequired: boolean;
  isActive: boolean;
  allowedDomains: string[];
  supportTeamIds: number[];
  departments?: {
    id: number;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}