import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WorkspaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
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

  @ApiPropertyOptional({ description: 'آدرس', example: 'تهران، خیابان ولیعصر' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'شهر', example: 'تهران' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'کد پستی', example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

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

  @ApiPropertyOptional({
    description: 'لوگو',
    example: '/files/workspaces-logo/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;
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

  @ApiPropertyOptional({ description: 'آدرس' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'شهر' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'کد پستی' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

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

  @ApiPropertyOptional({
    description: 'لوگو',
    example: '/files/workspaces-logo/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;
}

export class WorkspaceResponseDto {
  id: number;
  organizationId: number;
  managerStaffId: number;
  name: string;
  code: string;
  slug: string;
  status: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string;
  locale: string;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
