import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @GetCurrentUserId() userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, createProjectDto);
  }

  @Get()
  async findAll(@GetCurrentUserId() userId: string) {
    return this.projectsService.findAll(userId);
  }

  @Get(":id")
  async findOne(@GetCurrentUserId() userId: string, @Param("id") id: string) {
    return this.projectsService.findOne(id, userId);
  }

  @Patch(":id")
  async update(
    @GetCurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, updateProjectDto);
  }

  @Delete(":id")
  async remove(@GetCurrentUserId() userId: string, @Param("id") id: string) {
    return this.projectsService.remove(id, userId);
  }
}
