import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { GymsModule } from '../gyms/gyms.module';

@Module({
  imports: [OrganizationsModule, GymsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
