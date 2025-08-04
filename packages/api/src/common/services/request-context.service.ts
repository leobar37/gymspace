import { Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { IRequestContext, IUser, IGym, IOrganization, Permission } from '@gymspace/shared';
import { UUID } from '@gymspace/shared';

@Injectable()
export class RequestContextService implements IRequestContext {
  private _user: IUser;
  private _gym?: IGym;
  private _organization?: IOrganization;
  private _permissions: Permission[] = [];

  get user(): IUser {
    return this._user;
  }

  get gym(): IGym | undefined {
    return this._gym;
  }

  get organization(): IOrganization | undefined {
    return this._organization;
  }

  get permissions(): Permission[] {
    return this._permissions;
  }

  hasPermission(permission: Permission): boolean {
    return this._permissions.includes(permission);
  }

  canAccess(resource: string, action: string): boolean {
    const permissionKey = `${resource.toUpperCase()}_${action.toUpperCase()}` as Permission;
    return this.hasPermission(permissionKey);
  }

  getGymId(): UUID | undefined {
    return this._gym?.id;
  }

  getOrganizationId(): UUID | undefined {
    return this._organization?.id;
  }

  getUserId(): UUID {
    return this._user.id;
  }

  /**
   * Initialize context from request
   */
  fromRequest(request: FastifyRequest): RequestContextService {
    // User will be populated by auth guard
    if (request.user) {
      this._user = request.user as IUser;
    }

    // Gym ID from header
    const gymId = request.headers['x-gym-id'] as string;
    if (gymId && request.gym) {
      this._gym = request.gym as IGym;
    }

    // Organization from user's context
    if (request.organization) {
      this._organization = request.organization as IOrganization;
    }

    // Permissions from user's role
    if (request.permissions) {
      this._permissions = request.permissions as Permission[];
    }

    return this;
  }

  /**
   * Create empty context for system operations
   */
  createEmpty(): RequestContextService {
    // Used for system operations that don't have a user context
    return this;
  }

  /**
   * Create context for specific user (used in testing or system operations)
   */
  forUser(user: IUser, permissions: Permission[] = []): RequestContextService {
    this._user = user;
    this._permissions = permissions;
    return this;
  }

  /**
   * Set gym context
   */
  withGym(gym: IGym): RequestContextService {
    this._gym = gym;
    return this;
  }

  /**
   * Set organization context
   */
  withOrganization(organization: IOrganization): RequestContextService {
    this._organization = organization;
    return this;
  }

  /**
   * Add permissions
   */
  withPermissions(permissions: Permission[]): RequestContextService {
    this._permissions = [...new Set([...this._permissions, ...permissions])];
    return this;
  }
}
