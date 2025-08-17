import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as CoreAuthModule } from '../../core/auth/auth.module';
import { CacheModule } from '../../core/cache/cache.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EmailModule } from '../../core/email/email.module';
import { ResetPasswordMeService } from '../../core/auth/services/reset-password-me.service';

@Module({
  imports: [CoreAuthModule, CacheModule, DatabaseModule, EmailModule],
  controllers: [AuthController],
  providers: [ResetPasswordMeService],
  exports: [CoreAuthModule],
})
export class AuthModule {}
