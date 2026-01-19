import { Controller, Get, Body, UseGuards, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@GetCurrentUserId() userId: string) {
    return this.settingsService.getConfig(userId);
  }

  @Put()
  updateSettings(
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateSettingsDto
  ) {
    return this.settingsService.updateConfig(userId, dto);
  }
}