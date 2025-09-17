import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../core/auth/guards/admin-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { Permission } from '@gymspace/shared';

export const ADMIN_REQUIRED_KEY = 'admin_required';

/**
 * Decorator to mark routes as admin-only
 * Automatically applies AdminAuthGuard and PermissionGuard
 */
export const Admin = (...permissions: Permission[]) => {
  return applyDecorators(
    SetMetadata(ADMIN_REQUIRED_KEY, true),
    UseGuards(AdminAuthGuard, PermissionGuard),
    SetMetadata('permissions', permissions),
  );
};