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
import { IGym, IOrganization, ISubscription, Permission, PERMISSIONS } from '@gymspace/shared';
import { RequestContext } from '../../../common/services/request-context.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly TOKEN_CACHE_TTL = 300000; // 5 minutes in milliseconds for token validation cache
  private readonly GYM_CONTEXT_CACHE_TTL = 600000; // 10 minutes in milliseconds for gym context
  private readonly DEFAULT_GYM_CACHE_TTL = 1800000; // 30 minutes in milliseconds for default gym

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private cacheService: CacheService,
  ) {}

  /**
   * Validate token and attempt refresh if expired
   */
  private async validateOrRefreshToken(token: string, refreshToken?: string): Promise<any> {
    try {
      // Check if token is blacklisted first
      const isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      let user: any;

      try {
        // Always validate token with auth service (no cache)
        user = await this.authService.validateToken(token);
      } catch (tokenError) {
        // If token validation fails and we have a refresh token, try to refresh
        if (refreshToken) {
          this.logger.debug('Access token expired, attempting refresh');

          try {
            const refreshedTokens = await this.authService.refreshToken(refreshToken);
            // Validate the new token
            const newUser = await this.authService.validateToken(refreshedTokens.access_token);
            // Return new user with updated token info
            return {
              user: newUser,
              newTokens: refreshedTokens,
            };
          } catch (refreshError) {
            this.logger.warn('Token refresh failed:', refreshError.message);
            throw new UnauthorizedException('Token expired and refresh failed');
          }
        }

        // No refresh token available or refresh failed
        throw tokenError;
      }

      return { user };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if route requires SUPER_ADMIN permission (treat as public for now)
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route requires SUPER_ADMIN, treat it as public (no token validation)
    if (requiredPermissions && requiredPermissions.includes(PERMISSIONS.SUPER_ADMIN)) {
      const request = context.switchToHttp().getRequest();
      // Create empty context for SUPER_ADMIN routes
      const requestContext = new RequestContext();
      request.requestContext = requestContext.createEmpty();
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.replace('Bearer ', '');
    const refreshToken = request.headers['x-refresh-token'] as string;

    try {
      // Validate token and potentially refresh if expired
      const tokenValidation = await this.validateOrRefreshToken(token, refreshToken);

      request.user = tokenValidation.user;

      // If token was refreshed, add new tokens to response headers
      if (tokenValidation.newTokens) {
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-New-Access-Token', tokenValidation.newTokens.access_token);
        response.setHeader('X-New-Refresh-Token', tokenValidation.newTokens.refresh_token);
      }

      // Get gym context if gym ID is provided, or get first active gym from user's organization
      const gymId = request.headers['x-gym-id'] as string;
      let gym: (IGym & { organization: IOrganization }) | null = null;

      if (gymId) {
        // Try to get cached gym context
        gym = await this.cacheService.getGymContext(gymId, tokenValidation.user.id);

        if (!gym) {
          // If not cached, fetch from auth service
          gym = await this.authService.getGymContext(gymId, tokenValidation.user.id);

          // Cache the gym context if found
          if (gym) {
            await this.cacheService.cacheGymContext(
              gymId,
              tokenValidation.user.id,
              gym,
              this.GYM_CONTEXT_CACHE_TTL,
            );
          }
        }
      }

      // If no gym context found with gymId, try to get default gym
      if (!gym) {
        // Try to get cached default gym
        gym = await this.cacheService.getDefaultGym(tokenValidation.user.id);

        if (!gym) {
          // If not cached, fetch from auth service
          gym = await this.authService.getDefaultGymForUser(tokenValidation.user.id);

          // Cache the default gym if found
          if (gym) {
            await this.cacheService.cacheDefaultGym(
              tokenValidation.user.id,
              gym,
              this.DEFAULT_GYM_CACHE_TTL,
            );
          }
        }
      }

      let subscription: ISubscription | undefined;

      if (gym) {
        request.gym = gym;
        request.organization = gym.organization;

        // Load organization's active subscription if organization exists
        if (gym.organization?.id) {
          subscription = await this.authService.getOrganizationSubscription(gym.organization.id);
          if (subscription) {
            request.subscription = subscription;
          }
        }
      }

      // Get user permissions for the selected gym context
      // Note: getUserPermissions already uses caching internally through CacheService
      const permissions = await this.authService.getUserPermissions(
        tokenValidation.user.id,
        gym?.id,
      );
      
      // Store permissions (including SUPER_ADMIN if user has it)
      request.permissions = permissions;

      // Create and initialize RequestContext for this request
      const requestContext = new RequestContext();
      request.requestContext = requestContext.fromRequest(request);

      return true;
    } catch (error) {
      console.log('err', error?.message);

      // If it's already an UnauthorizedException with a specific message, preserve it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Otherwise, throw a generic invalid token error
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
