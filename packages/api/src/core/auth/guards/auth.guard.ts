import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

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

      // Get gym context if gym ID is provided
      const gymId = request.headers['x-gym-id'] as string;
      if (gymId) {
        const gym = await this.authService.getGymContext(gymId, user.id);
        request.gym = gym;
        request.organization = gym.organization;
      }

      // Get user permissions
      const permissions = await this.authService.getUserPermissions(user.id, gymId);
      request.permissions = permissions;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
