import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BlogCategoryDto } from '../dtos/blog-category.dto';
import { BlogCategoryService } from '../services/blog-category.service';
import { BlogCategoryQueryDto, sort } from '../dtos/blog-category-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { GetUserId } from '../../shared/decorators/get-user-id.decorator';
import { UrlPipe } from '../../shared/pips/url.pipe';

@ApiTags('BlogCategory')
@ApiBearerAuth('JWT-auth')
@Controller('blog-category')
export class BlogCategoryController {
  constructor(private readonly blogCategoryService: BlogCategoryService) {}

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
  findAll(@Query() queryParams: BlogCategoryQueryDto) {
    return this.blogCategoryService.findAll(queryParams);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  create(@Body(UrlPipe) body: BlogCategoryDto, @GetUserId() userId: number) {
    return this.blogCategoryService.create(body, userId);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.blogCategoryService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  update(
    @Param('id') id: string,
    @Body(UrlPipe) body: BlogCategoryDto,
    @GetUserId() userId: number,
  ) {
    return this.blogCategoryService.update(id, body, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string, @GetUserId() userId: number) {
    return this.blogCategoryService.delete(id, userId);
  }
}