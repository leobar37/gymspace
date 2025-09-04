import { Module } from '@nestjs/common';
import { CheckInsController } from './check-ins.controller';
import { CheckInsService } from './check-ins.service';
import { GymsModule } from '../gyms/gyms.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [GymsModule, ClientsModule],
  controllers: [CheckInsController],
  providers: [CheckInsService],
  exports: [CheckInsService],
})
export class CheckInsModule {}
