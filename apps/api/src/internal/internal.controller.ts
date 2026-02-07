import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { InternalService } from './internal.service';
import { WorkerApiKeyGuard } from '../common/guards/worker-api-key.guard';
import { 
  UpdateDeploymentStatusDto, 
  CreateLogsDto, 
  UpdateProjectStatusDto, 
  UpdateDomainStatusDto,
  DeploymentNotificationDto 
} from './dto';
import { LogSource } from 'generated/prisma/enums';

@Controller('internal')
@UseGuards(WorkerApiKeyGuard)
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Patch('deployments/:id/status')
  updateDeploymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeploymentStatusDto
  ) {
    return this.internalService.updateDeploymentStatus(id, dto);
  }

  @Post('deployments/:id/logs')
  createLogs(
    @Param('id') id: string,
    @Body() dto: CreateLogsDto
  ) {
    return this.internalService.createLogs(id, dto);
  }

  @Get('deployments/:id/logs')
  getLogs(
    @Param('id') id: string,
    @Query('source') source?: LogSource
  ) {
    return this.internalService.getLogs(id, source);
  }

  @Get('git/installation-token/:id')
  getInstallationToken(@Param('id') installationId: string) {
    return this.internalService.getInstallationToken(installationId);
  }

  @Get('settings/by-project/:id')
  getSettingsByProject(@Param('id') projectId: string) {
    return this.internalService.getSettingsByProject(projectId);
  }

  @Get('deployments/expired')
  getExpiredDeployments() {
    return this.internalService.getExpiredDeployments();
  }

  @Post('logs/cleanup')
  cleanupLogs() {
    return this.internalService.cleanupLogs();
  }

  @Delete('deployments/:id/resources')
  deleteDeploymentResources(@Param('id') id: string) {
    return this.internalService.deleteDeploymentResources(id);
  }

  @Patch('projects/:id/status')
  updateProjectStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto
  ) {
    return this.internalService.updateProjectStatus(id, dto);
  }

  @Get('domains/pending')
  getPendingDomains() {
    return this.internalService.getPendingDomains();
  }

  @Patch('domains/:id/status')
  updateDomainStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDomainStatusDto
  ) {
    return this.internalService.updateDomainStatus(id, dto);
  }

  @Post('notifications/deployment')
  sendDeploymentNotification(@Body() dto: DeploymentNotificationDto) {
    return this.internalService.sendDeploymentNotification(dto);
  }
}
