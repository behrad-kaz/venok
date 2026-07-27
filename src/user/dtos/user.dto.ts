import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UserDto {
  @ApiProperty({ description: 'نام', example: 'علی' })
  @IsString()
  @IsNotEmpty({ message: 'نام نباید خالی باشد' })
  @MinLength(2, { message: 'نام حداقل ۲ کاراکتر باید باشد' })
  @MaxLength(50, { message: 'نام حداکثر ۵۰ کاراکتر باید باشد' })
  firstName: string;

  @ApiProperty({ description: 'نام خانوادگی', example: 'محمدی' })
  @IsString()
  @IsNotEmpty({ message: 'نام خانوادگی نباید خالی باشد' })
  @MinLength(2, { message: 'نام خانوادگی حداقل ۲ کاراکتر باید باشد' })
  @MaxLength(50, { message: 'نام خانوادگی حداکثر ۵۰ کاراکتر باید باشد' })
  lastName: string;

  @ApiProperty({ description: 'ایمیل', example: 'ali@gmail.com' })
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است' })
  @IsNotEmpty({ message: 'ایمیل نباید خالی باشد' })
  email: string;

  @ApiProperty({ description: 'شماره تماس', example: '09123456789' })
  @IsString()
  @IsNotEmpty({ message: 'شماره تماس نباید خالی باشد' })
  @Matches(/^09[0-9]{9}$/, { message: 'شماره تماس نامعتبر است. باید با 09 شروع شود و ۱۱ رقم باشد' })
  mobile: string;

  @ApiProperty({ description: 'رمز عبور', example: '12345678' })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور نباید خالی باشد' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر باید باشد' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'رمز عبور باید حداقل شامل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'نقش کاربر',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'آواتار',
    example: '/files/avatar.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({
    description: 'شناسه سازمان',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  organizationId?: number;
}

export class LoginDto {
  @ApiProperty({ description: 'شماره همراه', example: '09123456789' })
  @IsString()
  @IsNotEmpty({ message: 'شماره همراه نباید خالی باشد' })
  @Matches(/^09[0-9]{9}$/, { message: 'شماره همراه نامعتبر است. باید با 09 شروع شود و ۱۱ رقم باشد' })
  mobile: string;

  @ApiProperty({ description: 'رمز عبور', example: '12345678' })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور نباید خالی باشد' })
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'نام' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'نام خانوادگی' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'شماره تماس' })
  @IsOptional()
  @IsString()
  @Matches(/^09[0-9]{9}$/, { message: 'شماره تماس نامعتبر است' })
  mobile?: string;

  @ApiPropertyOptional({
    description: 'آواتار - برای حذف مقدار null ارسال کنید',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({ description: 'وضعیت فعال بودن' })
  @IsOptional()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'رمز عبور فعلی' })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور فعلی نباید خالی باشد' })
  currentPassword: string;

  @ApiProperty({ description: 'رمز عبور جدید' })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور جدید نباید خالی باشد' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر باید باشد' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'رمز عبور باید حداقل شامل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد',
  })
  newPassword: string;
}