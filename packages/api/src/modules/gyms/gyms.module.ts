import { Module } from '@nestjs/common';
import { GymsController } from './gyms.controller';
import { GymsService } from './gyms.service';
import { BaseGymService } from './base-gym.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [GymsController],
  providers: [GymsService, BaseGymService],
  exports: [GymsService, BaseGymService],
})
export class GymsModule {}
