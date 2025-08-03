import { Module } from '@nestjs/common';
import { MembershipPlansController } from './membership-plans.controller';
import { GymMembershipPlansService } from './membership-plans.service';
import { GymsModule } from '../gyms/gyms.module';

@Module({
  imports: [GymsModule],
  controllers: [MembershipPlansController],
  providers: [GymMembershipPlansService],
  exports: [GymMembershipPlansService],
})
export class MembershipPlansModule {}
