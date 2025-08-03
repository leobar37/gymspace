import { Module } from '@nestjs/common';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { GymsModule } from '../gyms/gyms.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [GymsModule, ClientsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
