import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from './controllers/staff.controller';
import { StaffService } from './services/staff.service';
import { StaffEntity } from './entities/staff.entity';
import { OrganizationEntity } from '../organization/entities/organization.entity';
import { UserEntity } from '../user/entities/user.entity';
import { SupportTeamEntity } from '../support/entities/support-team.entity';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffEntity,
      OrganizationEntity,
      UserEntity,
      SupportTeamEntity,
      WorkspaceEntity,
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService, WorkspaceService],
  exports: [StaffService],
})
export class StaffModule {}