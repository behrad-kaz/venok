import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserEntity } from './entities/user.entity';
import { StaffModule } from '../staff/staff.module';
import { StaffEntity } from '../staff/entities/staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, StaffEntity]), StaffModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
