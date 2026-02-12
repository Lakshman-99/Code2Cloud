import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  getOverview(@GetCurrentUserId() userId: string) {
    return this.analyticsService.getOverview(userId);
  }

  @Get("projects/:projectId")
  getProjectAnalytics(
    @GetCurrentUserId() userId: string,
    @Param("projectId") projectId: string,
  ) {
    return this.analyticsService.getProjectAnalytics(userId, projectId);
  }
}
