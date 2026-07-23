import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './controllers/blog.controller';
import { BlogService } from './services/blog.service';
import { BlogEntity } from './entities/blog.entity';
import { BlogCategoryEntity } from './entities/blog-category.entity';
import { BlogCategoryController } from './controllers/blog.category.controller';
import { BlogCategoryService } from './services/blog-category.service';
import { LogService } from '../shared/services/log.service';
import { LogEntity } from '../shared/schemas/log.entity';
import { UserEntity } from '../user/entities/user.entity';  

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogEntity,
      BlogCategoryEntity,
      LogEntity,
      UserEntity, 
    ]),
  ],
  controllers: [BlogController, BlogCategoryController],
  providers: [
    BlogService,
    BlogCategoryService,
    LogService,
  ],
  exports: [LogService],
})
export class BlogModule {}