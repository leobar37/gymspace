import { Injectable, CanActivate } from '@nestjs/common';

/**
 * Guard that always returns true - used for public routes
 */
@Injectable()
export class PublicGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
