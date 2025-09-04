import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { GymsModule } from '../gyms/gyms.module';
import { ClientStatsService } from './helpers/client-stats.service';
import { ClientBaseService } from './helpers/client.base';

@Module({
  imports: [OrganizationsModule, GymsModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientStatsService, ClientBaseService],
  exports: [ClientsService, ClientStatsService, ClientBaseService],
})
export class ClientsModule {}
