import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inngest } from 'inngest';
import { isEmpty } from 'radash';
/**
 * Inngest client for handling event-driven data processing and background jobs
 */
@Injectable()
export class IngestClient {
  private readonly logger = new Logger(IngestClient.name);
  private readonly client: Inngest;

  constructor(private readonly configService: ConfigService) {
    const appId = this.configService.get<string>('app.name', 'gymspace-api');
    const environment = this.configService.get<string>('app.environment', 'development');

    const eventKey = this.configService.get<string>('ingestKey');
    this.client = new Inngest({
      id: `${appId}-${environment}`,
      eventKey: this.configService.get<string>('ingestKey'),
      isDev: environment === 'development',
    });
    if (!isEmpty(eventKey)) {
      console.log('found event key ingest=======');
    }

    this.logger.log(`Inngest client initialized with ID: ${appId}-${environment}`);
  }

  /**
   * Get the Inngest client instance
   * @deprecated Use the client directly instead of getClient()
   */
  getClient(): Inngest {
    return this.client;
  }

  /**
   * Get the raw Inngest client for typing compatibility
   */
  get inngest(): Inngest {
    return this.client;
  }

  /**
   * Create a function with the Inngest client
   */
  createFunction(...args: Parameters<Inngest['createFunction']>) {
    return this.client.createFunction(...args);
  }

  /**
   * Send an event to Inngest for processing
   */
  async sendEvent(
    eventName: string,
    data: Record<string, any>,
    options?: {
      user?: Record<string, any>;
      ts?: number;
      v?: string;
    },
  ): Promise<void> {
    try {
      await this.client.send({
        name: eventName,
        data,
        user: options?.user,
        ts: options?.ts,
        v: options?.v,
      });

      this.logger.debug(`Event sent successfully: ${eventName}`);
    } catch (error) {
      this.logger.error(`Failed to send event: ${eventName}`, error);
      throw error;
    }
  }

  /**
   * Send multiple events in batch
   */
  async sendEvents(
    events: Array<{
      name: string;
      data: Record<string, any>;
      user?: Record<string, any>;
      ts?: number;
      v?: string;
    }>,
  ) {
    try {
      await this.client.send(events);
      this.logger.debug(`Batch events sent successfully`, { count: events.length });
    } catch (error) {
      this.logger.error(`Failed to send batch events`, error);
      throw error;
    }
  }
}
