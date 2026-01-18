import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DomainsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, domainName: string) {
    // 1. Verify Project
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');

    // 2. Check Global Availability
    const existing = await this.prisma.domain.findUnique({ where: { name: domainName } });
    if (existing) throw new BadRequestException('Domain is already in use');

    // 3. Create
    return this.prisma.domain.create({
      data: {
        name: domainName,
        projectId
      }
    });
  }

  async findAll(userId: string, projectId: string) {
    // Verify Project
    const count = await this.prisma.project.count({ where: { id: projectId, userId } });
    if (count === 0) throw new NotFoundException('Project not found');

    return this.prisma.domain.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(userId: string, id: string) {
    const domain = await this.prisma.domain.findFirst({
      where: { id, project: { userId } }
    });
    if (!domain) throw new NotFoundException('Domain not found');

    return this.prisma.domain.delete({ where: { id } });
  }
}