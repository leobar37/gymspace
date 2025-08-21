import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { networkInterfaces } from 'os';
import { LoggerService } from './core/logger/logger.service';

async function bootstrap() {
  // Create app with custom logger configuration
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Disable Fastify's built-in logger
    }),
    {
      bufferLogs: true, // Buffer logs until custom logger is ready
    },
  );

  // Get and use custom logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Security
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });

  // File upload support
  await app.register(fastifyMultipart as any, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
      headerPairs: 2000,
    },
  });

  // CORS (relax in dev for mobile LAN access)
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow mobile apps / curl
      if (nodeEnv === 'development') return cb(null, true);
      const allowed = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');
      if (allowed === '*' || origin.startsWith(allowed)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Gym-Id'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Determine port early for Swagger server URLs
  const port = configService.get<number>('PORT', 3000);

  // Helper to find first LAN IPv4
  const getFirstLanIp = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          if (
            net.address.startsWith('192.168.') ||
            net.address.startsWith('10.') ||
            net.address.startsWith('172.')
          ) {
            return net.address;
          }
        }
      }
    }
    return null;
  };
  const lanIp = getFirstLanIp();

  // Swagger documentation
  let swaggerBuilder = new DocumentBuilder()
    .setTitle('GymSpace API')
    .setDescription('The GymSpace Gym Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Gym-Id', in: 'header' }, 'gym-id')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Gyms', 'Gym management operations')
    .addTag('Organizations', 'Organization management')
    .addTag('Clients', 'Client management')
    .addTag('Membership Plans', 'Membership plan management')
    .addTag('Contracts', 'Contract management')
    .addTag('Check-ins', 'Check-in tracking')
    .addTag('Evaluations', 'Client evaluations')
    .addTag('Invitations', 'Invitation management')
    .addTag('Leads', 'Lead management')
    .addTag('Public Catalog', 'Public gym catalog')
    .addTag('Dashboard', 'Dashboard statistics and metrics')
    .addTag('Health', 'Health check endpoints')
    .addServer(`http://localhost:${port}/${apiPrefix}`, 'Development (localhost)');

  if (lanIp) {
    swaggerBuilder = swaggerBuilder.addServer(
      `http://${lanIp}:${port}/${apiPrefix}`,
      'Development (LAN)',
    );
  }

  swaggerBuilder = swaggerBuilder.addServer(`https://api.gymspace.com/${apiPrefix}`, 'Production');

  const config = swaggerBuilder.build();
  const document = SwaggerModule.createDocument(app, config);

  document.info.contact = { name: 'GymSpace API Support', email: 'support@gymspace.com' };
  document.info.license = { name: 'MIT' };

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });

  // Generate OpenAPI files in development mode
  if (nodeEnv === 'development') {
    try {
      const rootDir = join(__dirname, '../../..');
      const outputPathJson = join(rootDir, 'openapi.json');
      const outputPathYaml = join(rootDir, 'openapi.yaml');
      writeFileSync(outputPathJson, JSON.stringify(document, null, 2));
      const yaml = require('js-yaml');
      const yamlContent = yaml.dump(document, { lineWidth: -1, noRefs: true, sortKeys: false });
      writeFileSync(outputPathYaml, yamlContent);
      const paths = Object.keys(document.paths || {});
      const totalEndpoints = paths.reduce((c, p) => c + Object.keys(document.paths[p]).length, 0);
      console.log(`📊 API Summary: ${paths.length} paths, ${totalEndpoints} endpoints`);
    } catch (error: any) {
      console.error('⚠️  Failed to generate OpenAPI files:', error.message);
    }
  }

  await app.listen(port, '0.0.0.0');

  // Log startup information
  logger.log(`Application started successfully`, 'Bootstrap');
  logger.log(`Local: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  if (lanIp) {
    logger.log(`LAN: http://${lanIp}:${port}/${apiPrefix}`, 'Bootstrap');
  }
  logger.log(`Swagger: http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');

  // Log environment info for Google Cloud
  if (configService.get('GOOGLE_CLOUD_PROJECT')) {
    logger.log(`Google Cloud Project: ${configService.get('GOOGLE_CLOUD_PROJECT')}`, 'Bootstrap');
    logger.log('Google Cloud Logging enabled', 'Bootstrap');
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
