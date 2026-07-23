import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity, LogType } from '../schemas/log.entity';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(LogEntity)
    private logRepository: Repository<LogEntity>,
  ) {}

  async createLog(
    message: string,
    type: LogType = LogType.Error,
    metadata?: any,
    userId?: number,
  ) {
    const log = this.logRepository.create({
      message,
      type,
      metadata,
      userId, // ← اضافه شد
    });
    return await this.logRepository.save(log);
  }

  async createErrorLog(
    error: Error,
    path?: string,
    method?: string,
    statusCode?: number,
    metadata?: any,
    userId?: number,
  ) {
    const log = this.logRepository.create({
      message: error.message,
      stack: error.stack,
      path,
      method,
      statusCode,
      type: LogType.Error,
      metadata,
      userId, // ← اضافه شد
    });
    return await this.logRepository.save(log);
  }

  async findAll(limit: number = 100, offset: number = 0) {
    return await this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findErrors(limit: number = 100) {
    return await this.logRepository.find({
      where: { type: LogType.Error },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteOldLogs(days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return await this.logRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date })
      .execute();
  }
}
