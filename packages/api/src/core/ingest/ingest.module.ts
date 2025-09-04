import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestClient } from './client';

/**
 * Global Ingest module that provides the Inngest client for event-driven processing
 * Available throughout the application without explicit imports
 * 
 * Note: Modules that need specific services should be imported at the handler registration level,
 * not here, to avoid circular dependencies
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [IngestClient],
  exports: [IngestClient],
})
export class IngestModule {}