import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { GymsModule } from '../gyms/gyms.module';

@Module({
  imports: [OrganizationsModule, GymsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
