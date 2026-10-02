import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BlogDto } from '../dtos/blog.dto';
import { BlogEntity } from '../entities/blog.entity';
import { BlogQueryDto } from '../dtos/blog-query.dto';
import { BlogCategoryEntity } from '../entities/blog-category.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { deleteImage, extractFileInfo } from '../../shared/utils/file-utils';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogEntity)
    private blogRepository: Repository<BlogEntity>,
    @InjectRepository(BlogCategoryEntity)
    private categoryRepository: Repository<BlogCategoryEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findAll(queryParams: BlogQueryDto) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (queryParams.title) {
      where.title = Like(`%${queryParams.title}%`);
    }
    if (queryParams.url) {
      where.url = Like(`%${queryParams.url}%`);
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.blogRepository.findAndCount({
      where,
      relations: {
        category: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        url: true,
        image: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        category: {
          id: true,
          title: true,
          url: true,
        },
      },
      order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ✅ متد جدید برای دریافت بلاگ‌های یک دسته‌بندی
  async findByCategory(categoryId: number, queryParams: BlogQueryDto) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    // ابتدا بررسی می‌کنیم که دسته‌بندی وجود دارد
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const where: any = {
      category: { id: categoryId },
    };

    if (queryParams.title) {
      where.title = Like(`%${queryParams.title}%`);
    }
    if (queryParams.url) {
      where.url = Like(`%${queryParams.url}%`);
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.blogRepository.findAndCount({
      where,
      relations: {
        category: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        url: true,
        image: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        category: {
          id: true,
          title: true,
          url: true,
        },
      },
      order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      category: {
        id: category.id,
        title: category.title,
        url: category.url,
      },
    };
  }

  async findOne(id: string) {
    const blog = await this.blogRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: {
        category: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        url: true,
        image: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        category: {
          id: true,
          title: true,
          url: true,
        },
      },
    });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  async create(body: BlogDto, userId: number) {
    const blogData: Partial<BlogEntity> = {
      title: body.title,
      content: body.content,
      url: body.url,
      image: body.image || null,
      createdBy: userId,
      createdAt: new Date(),
    };

    const newBlog = this.blogRepository.create(blogData);

    if (body.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: body.categoryId },
      });
      if (category) {
        newBlog.category = category;
      }
    }

    const saved = await this.blogRepository.save(newBlog);
    return this.findOne(saved.id.toString());
  }

  async update(id: string, body: BlogDto, userId: number) {
    const blog = await this.findOne(id);

    if (blog.createdBy !== userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user || user.role !== 'admin') {
        throw new NotFoundException('You are not allowed to update this blog');
      }
    }

    console.log(`📝 Updating blog ${id}`);
    console.log(`📸 Current image: ${blog.image}`);
    console.log(`📸 New image: ${body.image}`);

    if (body.image === null) {
      if (blog.image) {
        console.log(`🗑️ Deleting image: ${blog.image}`);
        const { fileName, folder } = extractFileInfo(blog.image);
        await deleteImage(fileName, folder);
        blog.image = null;
      }
    } else if (body.image && body.image !== blog.image) {
      if (blog.image) {
        console.log(`🗑️ Deleting old image: ${blog.image}`);
        const { fileName, folder } = extractFileInfo(blog.image);
        await deleteImage(fileName, folder);
      }
      blog.image = body.image;
    }

    blog.title = body.title;
    blog.content = body.content;
    blog.url = body.url;
    blog.updatedBy = userId;
    blog.updatedAt = new Date();

    if (body.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: body.categoryId },
      });
      if (category) {
        blog.category = category;
      }
    }

    const saved = await this.blogRepository.save(blog);
    console.log(`✅ Blog updated successfully`);
    return saved;
  }

  async delete(id: string, userId: number) {
    const blog = await this.findOne(id);

    if (blog.createdBy !== userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user || user.role !== 'admin') {
        throw new NotFoundException('You are not allowed to delete this blog');
      }
    }

    if (blog.image) {
      console.log(`🗑️ Deleting image: ${blog.image}`);
      const { fileName, folder } = extractFileInfo(blog.image);
      await deleteImage(fileName, folder);
    }

    blog.deletedBy = userId;
    blog.deletedAt = new Date();
    await this.blogRepository.save(blog);

    return { 
      message: 'Blog deleted successfully',
      deletedBy: userId,
      deletedAt: new Date(),
    };
  }
}