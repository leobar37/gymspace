import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { IGym, IOrganization } from '@gymspace/shared';
import { RequestContext } from '../../../common/services/request-context.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
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
      // Validate token and get user
      const user = await this.authService.validateToken(token);

      request.user = user;

      // Get gym context if gym ID is provided, or get first active gym from user's organization
      const gymId = request.headers['x-gym-id'] as string;
      let gym: (IGym & { organization: IOrganization }) | null = null;

      if (gymId) {
        gym = await this.authService.getGymContext(gymId, user.id);
      }
      if (!gym) {
        gym = await this.authService.getDefaultGymForUser(user.id);
      }

      if (gym) {
        request.gym = gym;
        request.organization = gym.organization;
      }

      // Get user permissions for the selected gym context
      const permissions = await this.authService.getUserPermissions(user.id, gym?.id);
      request.permissions = permissions;

      // Create and initialize RequestContext for this request
      const requestContext = new RequestContext();
      request.requestContext = requestContext.fromRequest(request);

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
