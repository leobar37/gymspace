import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as CoreAuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [CoreAuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
