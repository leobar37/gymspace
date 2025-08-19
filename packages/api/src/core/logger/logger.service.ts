import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private isProduction: boolean;
  private isGoogleCloudEnvironment: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.isGoogleCloudEnvironment = !!this.configService.get('GOOGLE_CLOUD_PROJECT');

    // Create transports array
    const transports: winston.transport[] = [];

    // Console transport for all environments
    const consoleFormat = this.isProduction
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      : winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}] ` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
          })
        );

    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: this.isProduction ? 'info' : 'debug',
      })
    );

    // Add Google Cloud Logging in production when running on Google Cloud
    if (this.isProduction && this.isGoogleCloudEnvironment) {
      const loggingWinston = new LoggingWinston({
        projectId: this.configService.get('GOOGLE_CLOUD_PROJECT'),
        keyFilename: this.configService.get('GOOGLE_APPLICATION_CREDENTIALS'),
        serviceContext: {
          service: 'gymspace-api',
          version: this.configService.get('APP_VERSION', '1.0.0'),
        },
        defaultCallback: (err) => {
          if (err) {
            console.error('Error sending logs to Google Cloud Logging:', err);
          }
        },
      });

      transports.push(loggingWinston);
    }

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

    // In Google Cloud, structure the error properly
    if (this.isGoogleCloudEnvironment) {
      this.logger.error(message, {
        context,
        error: {
          message,
          stack: trace,
        },
      });
    } else {
      this.logger.error(message, error);
    }
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
    this.logger.info('HTTP Request', {
      httpRequest: {
        requestMethod: method,
        requestUrl: url,
        status: statusCode,
        responseTime,
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