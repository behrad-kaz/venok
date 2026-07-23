import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import {
  UserDto,
  LoginDto,
  UpdateUserDto,
  ChangePasswordDto,
} from '../dtos/user.dto';
import { UserQueryDto, UserSort } from '../dtos/user-query.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)  // فقط ادمین
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'شماره صفحه',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'تعداد آیتم در هر صفحه',
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
    type: String,
    description: 'جستجو بر اساس نام',
  })
  @ApiQuery({
    name: 'lastName',
    required: false,
    type: String,
    description: 'جستجو بر اساس نام خانوادگی',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'جستجو بر اساس ایمیل',
  })
  @ApiQuery({
    name: 'mobile',
    required: false,
    type: String,
    description: 'جستجو بر اساس شماره تماس',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['admin', 'user', 'moderator'],
    description: 'فیلتر بر اساس نقش',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'فیلتر بر اساس وضعیت فعال',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: UserSort,
    description: 'مرتب‌سازی',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'ترتیب مرتب‌سازی',
  })
  findAll(
    @Query() queryParams: UserQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    console.log('👤 Current user from token:', currentUser);
    return this.userService.findAll(
      queryParams,
      currentUser.id,
      currentUser.role,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    console.log('👤 Current user from token:', currentUser);
    return this.userService.findOne(id, currentUser.id, currentUser.role);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.update(id, body, currentUser.id, currentUser.role);
  }

  @Put(':id/change-password')
  @Roles(UserRole.ADMIN, UserRole.USER)
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ChangePasswordDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.changePassword(
      id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Put(':id/toggle-status')
  @Roles(UserRole.ADMIN)
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.toggleStatus(id, currentUser.id, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.delete(id, currentUser.id, currentUser.role);
  }
}