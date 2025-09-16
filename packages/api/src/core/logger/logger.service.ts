import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';

    // Create transports array
    const transports: winston.transport[] = [];

    // Add Google Cloud Logging transport in production
    if (this.isProduction) {
      const loggingWinston = new LoggingWinston({
        projectId: this.configService.get('GCP_PROJECT_ID'),
        keyFilename: this.configService.get('GCP_KEY_FILE'), // Optional if using default service account
        logName: 'gymspace-api',
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: this.configService.get('K_SERVICE', 'gymspace-api'),
            revision_name: this.configService.get('K_REVISION', 'unknown'),
            configuration_name: this.configService.get('K_CONFIGURATION', 'unknown'),
            location: this.configService.get('GCP_REGION', 'us-central1'),
          },
        },
        defaultCallback: (err) => {
          if (err) {
            console.error('Error sending log to Google Cloud Logging:', err);
          }
        },
      });
      transports.push(loggingWinston);
    }

    // Console transport for all environments (development and as fallback)
    const consoleFormat = this.isProduction
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        )
      : winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}] ` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
          }),
        );

    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: this.isProduction ? 'info' : 'debug',
      }),
    );

    // Create the logger
    this.logger = winston.createLogger({
      level: this.isProduction ? 'info' : 'debug',
      transports,
      // Add default metadata
      defaultMeta: {
        service: 'gymspace-api',
        environment: this.configService.get('NODE_ENV', 'development'),
      },
    });
  }

  log(message: any, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string): void {
    const error = {
      message,
      trace,
      context,
    };

    this.logger.error(message, error);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // Additional helper methods for structured logging
  logRequest(method: string, url: string, statusCode: number, responseTime: number): void {
    // Use Google Cloud Logging format for HTTP requests
    this.logger.info('HTTP Request', {
      httpRequest: {
        requestMethod: method,
        requestUrl: url,
        status: statusCode,
        latency: `${responseTime}ms`,
        responseSize: 0, // Can be added if needed
        userAgent: '', // Can be extracted from request headers
        remoteIp: '', // Can be extracted from request
      },
    });
  }

  logMetric(name: string, value: number, unit?: string): void {
    this.logger.info('Metric', {
      metric: {
        name,
        value,
        unit: unit || 'count',
      },
    });
  }

  logBusinessEvent(event: string, metadata?: Record<string, any>): void {
    this.logger.info(`Business Event: ${event}`, {
      event,
      ...metadata,
    });
  }
}
