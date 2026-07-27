import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTeamController } from './controllers/support-team.controller';
import { SupportTeamService } from './services/support-team.service';
import { SupportTeamEntity } from './entities/support-team.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { StaffEntity } from '../staff/entities/staff.entity';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { UserEntity } from '../user/entities/user.entity';
import { OrganizationEntity } from '../organization/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTeamEntity,
      WorkspaceEntity,
      StaffEntity,
      UserEntity,
      OrganizationEntity,
    ]),
  ],
  controllers: [SupportTeamController],
  providers: [SupportTeamService, WorkspaceService],
  exports: [SupportTeamService],
})
export class SupportModule {}