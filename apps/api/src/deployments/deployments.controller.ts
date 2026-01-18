import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { DeploymentsService } from "./deployments.service";
import { CreateDeploymentDto } from "./dto/create-deployment.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";

@Controller("deployments")
@UseGuards(JwtAuthGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  create(@GetCurrentUserId() userId: string, @Body() dto: CreateDeploymentDto) {
    return this.deploymentsService.create(userId, dto);
  }

  @Get()
  findAll(@GetCurrentUserId() userId: string) {
    return this.deploymentsService.findAll(userId);
  }

  @Get("project/:projectId")
  findByProject(
    @GetCurrentUserId() userId: string,
    @Param("projectId") projectId: string,
  ) {
    return this.deploymentsService.findAllByProject(userId, projectId);
  }

  @Get(":id")
  findOne(@GetCurrentUserId() userId: string, @Param("id") id: string) {
    return this.deploymentsService.findOne(userId, id);
  }
}
