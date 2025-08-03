import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { GymsModule } from '../gyms/gyms.module';
import { ClientsModule } from '../clients/clients.module';
import { MembershipPlansModule } from '../membership-plans/membership-plans.module';

@Module({
  imports: [GymsModule, ClientsModule, MembershipPlansModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
