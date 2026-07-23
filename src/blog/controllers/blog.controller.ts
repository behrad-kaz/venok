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
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BlogDto } from '../dtos/blog.dto';
import { BlogService } from '../services/blog.service';
import { BlogQueryDto, sort } from '../dtos/blog-query.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { GetUserId } from '../../shared/decorators/get-user-id.decorator';
import { UrlPipe } from '../../shared/pips/url.pipe';

@ApiTags('blog')
@ApiBearerAuth('JWT-auth')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get('public')
  publicRoute() {
    return { message: 'This is a public route' };
  }

  @Get()
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
    name: 'title',
    required: false,
    type: String,
    description: 'جستجو بر اساس عنوان',
  })
  @ApiQuery({
    name: 'url',
    required: false,
    type: String,
    description: 'جستجو بر اساس url',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: sort,
    description: 'مرتب‌سازی بر اساس: title, createdAt, updatedAt',
  })
  findAll(@Query() queryParams: BlogQueryDto) {
    return this.blogService.findAll(queryParams);
  }

  // ✅ مسیر جدید: دریافت بلاگ‌های یک دسته‌بندی خاص
  @Get('category/:categoryId')
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
    name: 'title',
    required: false,
    type: String,
    description: 'جستجو بر اساس عنوان',
  })
  @ApiQuery({
    name: 'url',
    required: false,
    type: String,
    description: 'جستجو بر اساس url',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: sort,
    description: 'مرتب‌سازی بر اساس: title, createdAt, updatedAt',
  })
  async findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query() queryParams: BlogQueryDto,
  ) {
    return this.blogService.findByCategory(categoryId, queryParams);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  create(@Body(UrlPipe) body: BlogDto, @GetUserId() userId: number) {
    return this.blogService.create(body, userId);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  update(
    @Param('id') id: string,
    @Body(UrlPipe) body: BlogDto,
    @GetUserId() userId: number,
  ) {
    return this.blogService.update(id, body, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string, @GetUserId() userId: number) {
    return this.blogService.delete(id, userId);
  }
}