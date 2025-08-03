import { SetMetadata } from '@nestjs/common';
import { Permission } from '@gymspace/shared';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for an endpoint
 * @param permissions Array of permissions required
 */
export const Allow = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
