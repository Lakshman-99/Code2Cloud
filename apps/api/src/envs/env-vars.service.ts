import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveEnvVarsDto } from './dto/env-var.dto';
import { EncryptionService } from 'src/common/utils/encryption.service';

@Injectable()
export class EnvVarsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService
  ) {}

  async findAll(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');

    const vars = await this.prisma.environmentVariable.findMany({
      where: { projectId },
      orderBy: { key: 'asc' }
    });

    return vars.map(v => ({
      ...v,
      value: this.encryption.decrypt(v.value),
    }));
  }

  async saveAll(userId: string, projectId: string, dto: SaveEnvVarsDto) {
    // 1. Verify Ownership
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');

    // 2. Transaction: Delete All -> Insert All
    // This is the cleanest way to sync the "current state of UI" with the DB
    return this.prisma.$transaction(async (tx) => {
      
      // A. Wipe existing config
      await tx.environmentVariable.deleteMany({
        where: { projectId }
      });

      // B. Insert new config (Encrypting each value)
      if (dto.variables.length > 0) {
        await tx.environmentVariable.createMany({
          data: dto.variables.map((v) => ({
            projectId,
            key: v.key,
            value: this.encryption.encrypt(v.value), 
            targets: v.targets
          }))
        });
      }

      await tx.project.update({
        where: { id: projectId },
        data: { 
          configChanged: true,
          updatedAt: new Date() 
        }
      });
      
      return { success: true, count: dto.variables.length };
    });
  }
}