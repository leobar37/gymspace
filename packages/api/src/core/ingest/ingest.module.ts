import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestClient } from './client';

/**
 * Global Ingest module that provides the Inngest client for event-driven processing
 * Available throughout the application without explicit imports
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [IngestClient],
  exports: [IngestClient],
})
export class IngestModule {}