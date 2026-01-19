import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService
  ) {}

  async getConfig(userId: string) {
    const config = await this.prisma.systemConfig.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Decrypt sensitive data before sending to UI
    if (config.slackWebhook) {
      config.slackWebhook = this.encryption.decrypt(config.slackWebhook);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, userId: uid, ...rest } = config;

    return rest;
  }

  async updateConfig(userId: string, dto: UpdateSettingsDto) {
    // Encrypt webhook if it's being updated
    let slackWebhook = dto.slackWebhook;
    if (slackWebhook && slackWebhook.trim() !== '') {
      slackWebhook = this.encryption.encrypt(slackWebhook);
    } else if (slackWebhook === '') {
        slackWebhook = undefined; // Clear it if empty string sent
    }

    const updatedConfig = await this.prisma.systemConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
        slackWebhook: slackWebhook || undefined
      },
      update: {
        ...dto,
        slackWebhook: slackWebhook !== undefined ? slackWebhook : undefined
      }
    });

    return updatedConfig;
  }
}