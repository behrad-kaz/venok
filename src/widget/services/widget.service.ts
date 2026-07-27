import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WidgetEntity } from '../entities/widget.entity';
import { CreateWidgetDto, UpdateWidgetDto } from '../dtos/widget.dto';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../../support/entities/support-team.entity';
import { UserRole } from '../../user/entities/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class WidgetService {
  constructor(
    @InjectRepository(WidgetEntity)
    private widgetRepository: Repository<WidgetEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(SupportTeamEntity)
    private teamRepository: Repository<SupportTeamEntity>,
  ) {}

  private generateWidgetToken(): string {
    return `wgt_${randomBytes(16).toString('hex')}`;
  }

  async getCurrentWidget(workspaceId: number) {
    let widget = await this.widgetRepository.findOne({
      where: { workspaceId },
    });

    // اگر ویجت وجود نداشت، یک ویجت پیش‌فرض ایجاد کن
    if (!widget) {
      const workspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      widget = this.widgetRepository.create({
        workspaceId,
        widgetToken: this.generateWidgetToken(),
        companyName: workspace.name || 'شرکت',
        primaryColor: '#14b8a6',
        buttonPosition: 'bottom-right',
        buttonSize: 'md',
        formTitle: 'چطور می‌تونیم کمکتون کنیم؟',
        formDescription: 'موضوع گفتگو را انتخاب کنید تا شما را به تیم مناسب وصل کنیم.',
        phonePlaceholder: 'شماره همراه خود را وارد کنید',
        submitButtonText: 'شروع گفتگو',
        successMessage: 'لینک گفتگو برای شما پیامک شد.',
        privacyText: 'با ثبت شماره، لینک گفتگو از طریق پیامک برای شما ارسال می‌شود.',
        showDepartmentSelect: true,
        showDescriptionField: true,
        descriptionRequired: false,
        isActive: true,
        allowedDomains: [],
        supportTeamIds: [],
      });

      await this.widgetRepository.save(widget);
    }

    // دریافت اطلاعات دپارتمان‌ها
    const departments = await this.teamRepository.find({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        isActive: true,
      },
    });

    return {
      ...widget,
      departments,
    };
  }

  async updateWidget(workspaceId: number, body: UpdateWidgetDto, userId: number, userRole: UserRole) {
    // فقط ادمین می‌تواند ویجت را ویرایش کند
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update widget settings');
    }

    const widget = await this.widgetRepository.findOne({
      where: { workspaceId },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    // به‌روزرسانی فیلدها
    if (body.companyName !== undefined) widget.companyName = body.companyName;
    if (body.logoUrl !== undefined) widget.logoUrl = body.logoUrl;
    if (body.primaryColor !== undefined) widget.primaryColor = body.primaryColor;
    if (body.buttonPosition !== undefined) widget.buttonPosition = body.buttonPosition;
    if (body.buttonSize !== undefined) widget.buttonSize = body.buttonSize;
    if (body.formTitle !== undefined) widget.formTitle = body.formTitle;
    if (body.formDescription !== undefined) widget.formDescription = body.formDescription;
    if (body.phonePlaceholder !== undefined) widget.phonePlaceholder = body.phonePlaceholder;
    if (body.submitButtonText !== undefined) widget.submitButtonText = body.submitButtonText;
    if (body.successMessage !== undefined) widget.successMessage = body.successMessage;
    if (body.privacyText !== undefined) widget.privacyText = body.privacyText;
    if (body.showDepartmentSelect !== undefined) widget.showDepartmentSelect = body.showDepartmentSelect;
    if (body.showDescriptionField !== undefined) widget.showDescriptionField = body.showDescriptionField;
    if (body.descriptionRequired !== undefined) widget.descriptionRequired = body.descriptionRequired;
    if (body.isActive !== undefined) widget.isActive = body.isActive;
    if (body.allowedDomains !== undefined) widget.allowedDomains = body.allowedDomains;
    if (body.supportTeamIds !== undefined) widget.supportTeamIds = body.supportTeamIds;

    widget.updatedBy = userId;

    const saved = await this.widgetRepository.save(widget);

    // دریافت اطلاعات دپارتمان‌ها - استفاده از In operator
    let departments: SupportTeamEntity[] = [];
    
    if (saved.supportTeamIds && saved.supportTeamIds.length > 0) {
      departments = await this.teamRepository.find({
        where: {
          id: In(saved.supportTeamIds),
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          isActive: true,
        },
      });
    }

    return {
      ...saved,
      departments,
    };
  }

  async getWidgetScript(workspaceId: number) {
    const widget = await this.widgetRepository.findOne({
      where: { workspaceId },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    // کد جاوااسکریپت ویجت
    const script = `
<script>
  (function() {
    const widgetConfig = {
      widgetToken: '${widget.widgetToken}',
      workspaceId: ${workspaceId},
      companyName: '${widget.companyName}',
      primaryColor: '${widget.primaryColor}',
      buttonPosition: '${widget.buttonPosition}',
      buttonSize: '${widget.buttonSize}',
      formTitle: '${widget.formTitle}',
      formDescription: '${widget.formDescription}',
      phonePlaceholder: '${widget.phonePlaceholder}',
      submitButtonText: '${widget.submitButtonText}',
      successMessage: '${widget.successMessage}',
      privacyText: '${widget.privacyText}',
      showDepartmentSelect: ${widget.showDepartmentSelect},
      showDescriptionField: ${widget.showDescriptionField},
      descriptionRequired: ${widget.descriptionRequired},
      isActive: ${widget.isActive}
    };
    
    // بارگذاری اسکریپت ویجت
    const script = document.createElement('script');
    script.src = 'https://chat.example.com/widget.js';
    script.dataset.config = JSON.stringify(widgetConfig);
    document.body.appendChild(script);
  })();
</script>
    `.trim();

    return {
      script,
      widgetToken: widget.widgetToken,
    };
  }
}