import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './services/supabase.service';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { PublicGuard } from './guards/public.guard';
import { EmailModule } from '../email/email.module';
import { CacheModule } from '../cache/cache.module';
import { SubscriptionsModule } from '../../modules/subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, EmailModule, CacheModule, forwardRef(() => SubscriptionsModule)],
  providers: [SupabaseService, AuthService, AuthGuard, PublicGuard],
  exports: [SupabaseService, AuthService, AuthGuard, PublicGuard],
})
export class AuthModule {}
