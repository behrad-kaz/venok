import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrganizationType {
  COMPANY = 'company',
  STORE = 'store',
  CAFE = 'cafe',
  RESTAURANT = 'restaurant',
  OTHER = 'other',
}

export enum LegalType {
  INDIVIDUAL = 'individual',
  CORPORATION = 'corporation',
  LLC = 'llc',
  OTHER = 'other',
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateOrganizationDto {
  @ApiProperty({ description: 'نام سازمان', example: 'آژانس سفر نمونه' })
  @IsString()
  @IsNotEmpty({ message: 'نام نباید خالی باشد' })
  @MaxLength(200, { message: 'نام حداکثر ۲۰۰ کاراکتر باید باشد' })
  name: string;

  @ApiPropertyOptional({ description: 'نام حقوقی', example: 'آژانس سفر نمونه' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @ApiProperty({ description: 'اسلاگ (URL)', example: 'travel-agency' })
  @IsString()
  @IsNotEmpty({ message: 'اسلاگ نباید خالی باشد' })
  @MaxLength(100, { message: 'اسلاگ حداکثر ۱۰۰ کاراکتر باید باشد' })
  slug: string;

  @ApiPropertyOptional({
    description: 'نوع سازمان',
    enum: OrganizationType,
    default: OrganizationType.COMPANY,
  })
  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType;

  @ApiPropertyOptional({
    description: 'نوع حقوقی',
    enum: LegalType,
    default: LegalType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(LegalType)
  legalType?: LegalType;

  @ApiPropertyOptional({ description: 'کد ملی', example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'کد اقتصادی', example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'وبسایت', example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ description: 'توضیحات', example: 'توضیحات سازمان' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'واحد پول', default: 'IRR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: 'منطقه', default: 'fa-IR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({ description: 'لوگو', example: '/files/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: 'نام سازمان' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'نام حقوقی' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @ApiPropertyOptional({ description: 'اسلاگ (URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'نوع سازمان', enum: OrganizationType })
  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType;

  @ApiPropertyOptional({ description: 'نوع حقوقی', enum: LegalType })
  @IsOptional()
  @IsEnum(LegalType)
  legalType?: LegalType;

  @ApiPropertyOptional({ description: 'وضعیت', enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @ApiPropertyOptional({ description: 'کد ملی' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'کد اقتصادی' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'وبسایت' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ description: 'توضیحات' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'واحد پول' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: 'منطقه' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({ description: 'لوگو', nullable: true })
  @IsOptional()
  @IsString()
  logo?: string | null;
}

export class OrganizationResponseDto {
  id: number;
  ownerUserId: number;
  name: string;
  legalName: string | null;
  slug: string;
  type: string;
  legalType: string;
  status: string;
  logo: string | null;
  nationalId: string | null;
  taxId: string | null;
  website: string | null;
  description: string | null;
  currency: string;
  locale: string;
  plan: string;
  subscriptionStatus: string;
  workspaces?: any[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}