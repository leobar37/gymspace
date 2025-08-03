import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  async ready() {
    const checks = {
      database: false,
      cache: false,
    };

    // Check database
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      // Database not ready
    }

    // Check cache
    try {
      await this.cacheService.set('health-check', true, 1);
      const value = await this.cacheService.get('health-check');
      checks.cache = value === true;
    } catch (error) {
      // Cache not ready
    }

    const isReady = Object.values(checks).every((check) => check === true);

    return {
      status: isReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
