import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../../common/decorators/allow.decorator';
import { Permission, PERMISSIONS } from '@gymspace/shared';
import { RequestContext } from '../../../common/services/request-context.service';
import { CacheService } from '../../cache/cache.service';

/**
 * AdminAuthGuard is responsible for protecting all /api/admin/* routes
 * It ensures only users with SUPER_ADMIN permission can access admin endpoints
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check if route is explicitly marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Extract authorization token
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.replace('Bearer ', '');

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Validate token
      const user = await this.authService.validateToken(token);
      request.user = user;

      // Get user permissions (SUPER_ADMIN should be global, not gym-specific)
      const permissions = await this.authService.getUserPermissions(user.id, null);

      // Check if user has SUPER_ADMIN permission
      if (!permissions.includes(PERMISSIONS.SUPER_ADMIN)) {
        this.logger.warn(`User ${user.id} attempted to access admin route without SUPER_ADMIN permission`);
        throw new UnauthorizedException('Insufficient permissions for admin access');
      }

      // Store permissions in request
      request.permissions = permissions;

      // Create RequestContext for admin operations
      const requestContext = new RequestContext();
      request.requestContext = requestContext.createAdmin(user, permissions);

      this.logger.debug(`Admin access granted for user ${user.id}`);
      return true;

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Admin authentication failed:', error.message);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}