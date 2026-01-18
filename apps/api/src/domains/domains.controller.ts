import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { DomainsService } from "./domains.service";
import { AddDomainDto } from "./dto/create-domain.dto";

@Controller("projects/:projectId/domains")
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  create(
    @GetCurrentUserId() userId: string,
    @Param("projectId") projectId: string,
    @Body() dto: AddDomainDto,
  ) {
    return this.domainsService.create(userId, projectId, dto.name);
  }

  @Get()
  findAll(
    @GetCurrentUserId() userId: string,
    @Param("projectId") projectId: string,
  ) {
    return this.domainsService.findAll(userId, projectId);
  }

  @Delete(":id")
  remove(@GetCurrentUserId() userId: string, @Param("id") id: string) {
    return this.domainsService.remove(userId, id);
  }
}
