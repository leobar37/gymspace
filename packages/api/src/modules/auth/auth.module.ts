import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as CoreAuthModule } from '../../core/auth/auth.module';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [CoreAuthModule, CacheModule],
  controllers: [AuthController],
  exports: [CoreAuthModule],
})
export class AuthModule {}
