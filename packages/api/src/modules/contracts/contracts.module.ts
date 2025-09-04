import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { GymsModule } from '../gyms/gyms.module';
import { MembershipPlansModule } from '../membership-plans/membership-plans.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractStatusHelper } from './helpers/contract-status.helper';
import { ContractBaseService } from './helpers/contract.base';

@Module({
  imports: [GymsModule, ClientsModule, MembershipPlansModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractStatusHelper, ContractBaseService],
  exports: [ContractsService, ContractStatusHelper],
})
export class ContractsModule {}
