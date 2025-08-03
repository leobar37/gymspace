import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './services/supabase.service';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { PublicGuard } from './guards/public.guard';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseService, AuthService, AuthGuard, PublicGuard],
  exports: [SupabaseService, AuthService, AuthGuard, PublicGuard],
})
export class AuthModule {}
