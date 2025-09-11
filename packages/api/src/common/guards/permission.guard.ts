import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, PERMISSIONS } from '@gymspace/shared';
import { PERMISSIONS_KEY } from '../decorators/allow.decorator';
import { AuthorizationException } from '../exceptions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // If the route requires SUPER_ADMIN, it's treated as public by AuthGuard
    // so we don't need to validate permissions here
    if (requiredPermissions.includes(PERMISSIONS.SUPER_ADMIN)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const requestContext = request.requestContext;

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      requestContext.hasPermission(permission),
    );

    if (!hasPermission) {
      throw new AuthorizationException('Insufficient permissions', requiredPermissions.join(', '));
    }

    return true;
  }
}
