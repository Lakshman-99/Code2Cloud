import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import Redis from "ioredis";

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    [key: string]: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: "up" | "down";
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initRedisClient();
  }

  private initRedisClient() {
    try {
      const redisUrl = this.configService.get<string>("REDIS_URL");
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          commandTimeout: 5000,
          lazyConnect: true,
        });

        this.redis.on("error", (err) => {
          this.logger.warn("Redis health check client error", err.message);
        });
      }
    } catch (error) {
      this.logger.warn("Failed to initialize Redis health client", error);
    }
  }

  /**
   * Liveness check - Is the application process alive?
   * Used by K8s livenessProbe
   * Should NOT check external dependencies
   */
  checkLiveness(): { status: "ok"; timestamp: string } {
    return { 
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check - Is the application ready to accept traffic?
   * Used by K8s readinessProbe
   * Should check all critical dependencies
   */
  async checkReadiness(): Promise<{
    status: "ready" | "not_ready";
    checks: Record<string, boolean>;
  }> {
    const checks: Record<string, boolean> = {};

    // Check database
    checks.database = await this.isDatabaseHealthy();

    // Check Redis (if configured)
    if (this.redis) {
      checks.redis = await this.isRedisHealthy();
    }

    const allHealthy = Object.values(checks).every((v) => v === true);

    return {
      status: allHealthy ? "ready" : "not_ready",
      checks,
    };
  }

  /**
   * Full health check - Detailed status of all components
   * Used for monitoring dashboards and debugging
   */
  async getFullHealth(): Promise<HealthCheckResult> {
    const checks: Record<string, ComponentHealth> = {};

    // Database health
    checks.database = await this.checkDatabase();

    // Redis health
    checks.redis = await this.checkRedis();

    // Memory health
    checks.memory = this.checkMemory();

    // Determine overall status
    const statuses = Object.values(checks).map((c) => c.status);
    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

    if (statuses.some((s) => s === "down")) {
      // If critical services are down
      const criticalServices = ["database"];
      const criticalDown = criticalServices.some(
        (svc) => checks[svc]?.status === "down",
      );
      overallStatus = criticalDown ? "unhealthy" : "degraded";
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  /**
   * Check if database is healthy (simple boolean)
   */
  private async isDatabaseHealthy(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if Redis is healthy (simple boolean)
   */
  private async isRedisHealthy(): Promise<boolean> {
    if (!this.redis) return true; // Redis is optional

    try {
      const result = await Promise.race([
        this.redis.ping(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Redis timeout")), 3000),
        ),
      ]);
      return result === "PONG";
    } catch {
      return false;
    }
  }

  /**
   * Detailed database health check
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: "up",
        responseTime,
        message: "Database connection successful",
      };
    } catch (error) {
      const responseTime = Date.now() - start;

      this.logger.error("Database health check failed", error);

      return {
        status: "down",
        responseTime,
        message:
          error instanceof Error ? error.message : "Database connection failed",
      };
    }
  }

  /**
   * Detailed Redis health check
   */
  private async checkRedis(): Promise<ComponentHealth> {
    if (!this.redis) {
      return {
        status: "up",
        message: "Redis not configured (optional)",
      };
    }

    const start = Date.now();

    try {
      const result = await Promise.race([
        this.redis.ping(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Redis timeout")), 3000),
        ),
      ]);

      const responseTime = Date.now() - start;

      if (result === "PONG") {
        // Get additional Redis info
        const info = await this.redis.info("memory");
        const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();

        return {
          status: "up",
          responseTime,
          message: "Redis connection successful",
          details: {
            usedMemory: usedMemory || "unknown",
          },
        };
      }

      return {
        status: "down",
        responseTime,
        message: "Unexpected Redis response",
      };
    } catch (error) {
      const responseTime = Date.now() - start;

      this.logger.warn("Redis health check failed", error);

      return {
        status: "down",
        responseTime,
        message:
          error instanceof Error ? error.message : "Redis connection failed",
      };
    }
  }

  /**
   * Memory usage health check
   */
  private checkMemory(): ComponentHealth {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapPercentage = Math.round(
      (memUsage.heapUsed / memUsage.heapTotal) * 100,
    );

    // Consider memory unhealthy if heap usage > 90%
    const status = heapPercentage > 90 ? "down" : "up";

    return {
      status,
      message:
        status === "up" ? "Memory usage normal" : "High memory usage detected",
      details: {
        heapUsedMB,
        heapTotalMB,
        heapPercentage: `${heapPercentage}%`,
        rssMB,
      },
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
