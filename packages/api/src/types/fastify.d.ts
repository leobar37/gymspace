import 'fastify';
import { IUser, IGym, IOrganization, Permission } from '@gymspace/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: IUser;
    gym?: IGym;
    organization?: IOrganization;
    permissions?: Permission[];
  }
}
