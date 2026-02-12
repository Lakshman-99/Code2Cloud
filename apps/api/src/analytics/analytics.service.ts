import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard Overview Analytics ─────────────────────────
  async getOverview(userId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total counts
    const [
      totalDeployments,
      totalProjects,
      deploymentsThisWeek,
      statusCounts,
      recentDeployments,
    ] = await Promise.all([
      // Total deployments for user
      this.prisma.deployment.count({
        where: { project: { userId } },
      }),

      // Total projects
      this.prisma.project.count({
        where: { userId },
      }),

      // Deployments this week
      this.prisma.deployment.count({
        where: {
          project: { userId },
          startedAt: { gte: sevenDaysAgo },
        },
      }),

      // Status distribution
      this.prisma.deployment.groupBy({
        by: ["status"],
        where: { project: { userId } },
        _count: { id: true },
      }),

      // Recent deployments with duration for avg build time
      this.prisma.deployment.findMany({
        where: {
          project: { userId },
          startedAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          duration: true,
          projectId: true,
          isSuccess: true,
          project: {
            select: { name: true, framework: true },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    // 2. Compute average build time (only completed deployments)
    const completedDeployments = recentDeployments.filter(
      (d) => d.duration !== null && d.isSuccess === true,
    );
    const avgBuildTime =
      completedDeployments.length > 0
        ? Math.round(
            completedDeployments.reduce((sum, d) => sum + (d.duration || 0), 0) /
              completedDeployments.length,
          )
        : 0;

    // 3. Success rate
    const totalCompleted = recentDeployments.filter((d) =>
      ["READY", "EXPIRED", "FAILED"].includes(d.status),
    ).length;
    const successCount = recentDeployments.filter(
      (d) => d.isSuccess === true,
    ).length;
    const successRate =
      totalCompleted > 0
        ? Math.round((successCount / totalCompleted) * 100)
        : 100;

    // 4. Deployments over time (last 30 days, grouped by day)
    const deploymentsOverTime = this.groupByDay(recentDeployments, thirtyDaysAgo, now);

    // 5. Status distribution map
    const statusDistribution: Record<string, number> = {};
    for (const sc of statusCounts) {
      statusDistribution[sc.status] = sc._count.id;
    }

    // 6. Deployments by project (top 10)
    const projectDeploymentCounts = await this.prisma.deployment.groupBy({
      by: ["projectId"],
      where: {
        project: { userId },
        startedAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const projectIds = projectDeploymentCounts.map((p) => p.projectId);
    const projectNames = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, framework: true },
    });

    const projectNameMap = new Map(projectNames.map((p) => [p.id, p]));
    const deploymentsByProject = projectDeploymentCounts.map((p) => ({
      projectId: p.projectId,
      projectName: projectNameMap.get(p.projectId)?.name || "Unknown",
      framework: projectNameMap.get(p.projectId)?.framework || "unknown",
      count: p._count.id,
    }));

    // 7. Build time trend (last 30 days, grouped by day)
    const buildTimeTrend = this.computeBuildTimeTrend(recentDeployments, thirtyDaysAgo, now);

    return {
      totalDeployments,
      totalProjects,
      deploymentsThisWeek,
      avgBuildTime,
      successRate,
      deploymentsOverTime,
      statusDistribution,
      deploymentsByProject,
      buildTimeTrend,
    };
  }

  // ── Per-Project Analytics ────────────────────────────────
  async getProjectAnalytics(userId: string, projectId: string) {
    // Verify ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, name: true, framework: true, createdAt: true },
    });

    if (!project) throw new NotFoundException("Project not found");

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalDeployments,
      deploymentsThisWeek,
      statusCounts,
      recentDeployments,
    ] = await Promise.all([
      this.prisma.deployment.count({
        where: { projectId },
      }),

      this.prisma.deployment.count({
        where: {
          projectId,
          startedAt: { gte: sevenDaysAgo },
        },
      }),

      this.prisma.deployment.groupBy({
        by: ["status"],
        where: { projectId },
        _count: { id: true },
      }),

      this.prisma.deployment.findMany({
        where: {
          projectId,
          startedAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          duration: true,
          commitHash: true,
          commitMessage: true,
          branch: true,
          projectId: true,
          isSuccess: true,
          project: {
            select: { name: true, framework: true },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    // Avg build time
    const completed = recentDeployments.filter(
      (d) => d.duration !== null && d.isSuccess === true,
    );
    const avgBuildTime =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, d) => sum + (d.duration || 0), 0) /
              completed.length,
          )
        : 0;

    // Success rate
    const totalFinished = recentDeployments.filter((d) =>
      ["READY", "EXPIRED", "FAILED"].includes(d.status),
    ).length;
    const successCount = recentDeployments.filter(
      (d) => d.isSuccess === true,
    ).length;
    const successRate =
      totalFinished > 0
        ? Math.round((successCount / totalFinished) * 100)
        : 100;

    // Fastest / slowest build
    const buildTimes = completed
      .map((d) => d.duration!)
      .filter((d) => d > 0);
    const fastestBuild = buildTimes.length > 0 ? Math.min(...buildTimes) : 0;
    const slowestBuild = buildTimes.length > 0 ? Math.max(...buildTimes) : 0;

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    for (const sc of statusCounts) {
      statusDistribution[sc.status] = sc._count.id;
    }

    // Deployments over time
    const deploymentsOverTime = this.groupByDay(recentDeployments, thirtyDaysAgo, now);

    // Build time trend
    const buildTimeTrend = this.computeBuildTimeTrend(recentDeployments, thirtyDaysAgo, now);

    // Recent deployments list (last 10)
    const recentActivity = recentDeployments.slice(0, 10).map((d) => ({
      id: d.id,
      status: d.status,
      startedAt: d.startedAt,
      finishedAt: d.finishedAt,
      duration: d.duration,
      commitHash: d.commitHash,
      commitMessage: d.commitMessage,
      branch: d.branch,
    }));

    return {
      projectId: project.id,
      projectName: project.name,
      framework: project.framework,
      totalDeployments,
      deploymentsThisWeek,
      avgBuildTime,
      successRate,
      fastestBuild,
      slowestBuild,
      statusDistribution,
      deploymentsOverTime,
      buildTimeTrend,
      recentActivity,
    };
  }

  // ── Helpers ──────────────────────────────────────────────

  private groupByDay(
    deployments: { startedAt: Date; status: string, isSuccess: boolean }[],
    startDate: Date,
    endDate: Date,
  ) {
    // Create a map of day → { total, success, failed }
    const dayMap = new Map<string, { date: string; total: number; success: number; failed: number }>();

    // Initialize all days in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split("T")[0];
      dayMap.set(key, { date: key, total: 0, success: 0, failed: 0 });
      current.setDate(current.getDate() + 1);
    }

    // Fill in data
    for (const d of deployments) {
      const key = d.startedAt.toISOString().split("T")[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.total++;
        if (d.isSuccess === true) entry.success++;
        if (d.status === "FAILED") entry.failed++;
      }
    }

    return Array.from(dayMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  private computeBuildTimeTrend(
    deployments: { startedAt: Date; duration: number | null; status: string, isSuccess: boolean }[],
    startDate: Date,
    endDate: Date,
  ) {
    const dayMap = new Map<string, { date: string; avgDuration: number; count: number; totalDuration: number }>();

    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split("T")[0];
      dayMap.set(key, { date: key, avgDuration: 0, count: 0, totalDuration: 0 });
      current.setDate(current.getDate() + 1);
    }

    for (const d of deployments) {
      if (d.duration === null || d.isSuccess !== true) continue;
      const key = d.startedAt.toISOString().split("T")[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.count++;
        entry.totalDuration += d.duration;
        entry.avgDuration = Math.round(entry.totalDuration / entry.count);
      }
    }

    return Array.from(dayMap.values())
      .map(({ date, avgDuration }) => ({ date, avgDuration }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
