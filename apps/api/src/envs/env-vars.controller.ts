import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { EnvVarsService } from "./env-vars.service";
import { GetCurrentUserId } from "src/common/decorators/get-current-user-id.decorator";
import { SaveEnvVarsDto } from "./dto/env-var.dto";

@Controller("projects/:projectId/envs")
@UseGuards(JwtAuthGuard)
export class EnvVarsController {
  constructor(private readonly envVarsService: EnvVarsService) {}

  @Put()
  saveAll(
    @GetCurrentUserId() userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: SaveEnvVarsDto
  ) {
    return this.envVarsService.saveAll(userId, projectId, dto);
  }

  @Get()
  findAll(
    @GetCurrentUserId() userId: string,
    @Param("projectId") projectId: string,
  ) {
    return this.envVarsService.findAll(userId, projectId);
  }
}
