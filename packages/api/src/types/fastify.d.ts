import 'fastify';
import { IUser, IGym, IOrganization, ISubscription, Permission } from '@gymspace/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: IUser;
    gym?: IGym;
    organization?: IOrganization;
    subscription?: ISubscription;
    permissions?: Permission[];
  }
}
