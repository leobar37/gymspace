import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { IGym, IOrganization } from '@gymspace/shared';
import { RequestContext } from '../../../common/services/request-context.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly TOKEN_CACHE_TTL = 300000; // 5 minutes in milliseconds for token validation cache
  private readonly GYM_CONTEXT_CACHE_TTL = 600000; // 10 minutes in milliseconds for gym context
  private readonly DEFAULT_GYM_CACHE_TTL = 1800000; // 30 minutes in milliseconds for default gym
  
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.replace('Bearer ', '');

    try {
      // Check if token is blacklisted (for logout functionality)
      const isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Try to get cached token validation first
      let user = await this.cacheService.getTokenValidation(token);
      
      if (!user) {
        // If not cached, validate token with auth service
        user = await this.authService.validateToken(token);
        
        // Cache the validated token for future requests
        await this.cacheService.cacheTokenValidation(token, user, this.TOKEN_CACHE_TTL);
      }

      request.user = user;

      // Get gym context if gym ID is provided, or get first active gym from user's organization
      const gymId = request.headers['x-gym-id'] as string;
      let gym: (IGym & { organization: IOrganization }) | null = null;

      if (gymId) {
        // Try to get cached gym context
        gym = await this.cacheService.getGymContext(gymId, user.id);
        
        if (!gym) {
          // If not cached, fetch from auth service
          gym = await this.authService.getGymContext(gymId, user.id);
          
          // Cache the gym context if found
          if (gym) {
            await this.cacheService.cacheGymContext(gymId, user.id, gym, this.GYM_CONTEXT_CACHE_TTL);
          }
        }
      }
      
      // If no gym context found with gymId, try to get default gym
      if (!gym) {
        // Try to get cached default gym
        gym = await this.cacheService.getDefaultGym(user.id);
        
        if (!gym) {
          // If not cached, fetch from auth service
          gym = await this.authService.getDefaultGymForUser(user.id);
          
          // Cache the default gym if found
          if (gym) {
            await this.cacheService.cacheDefaultGym(user.id, gym, this.DEFAULT_GYM_CACHE_TTL);
          }
        }
      }

      if (gym) {
        request.gym = gym;
        request.organization = gym.organization;
      }

      // Get user permissions for the selected gym context
      // Note: getUserPermissions already uses caching internally through CacheService
      const permissions = await this.authService.getUserPermissions(user.id, gym?.id);
      request.permissions = permissions;

      // Create and initialize RequestContext for this request
      const requestContext = new RequestContext();
      request.requestContext = requestContext.fromRequest(request);

      return true;
    } catch (error) {
      // If it's already an UnauthorizedException with a specific message, preserve it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Otherwise, throw a generic invalid token error
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
