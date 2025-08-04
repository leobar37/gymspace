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

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
  );

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });

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

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3001'),
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
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
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
    .addTag('Health', 'Health check endpoints')
    .addServer(`http://localhost:3000/${apiPrefix}`, 'Development server')
    .addServer(`https://api.gymspace.com/${apiPrefix}`, 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add additional OpenAPI properties
  document.info.contact = {
    name: 'GymSpace API Support',
    email: 'support@gymspace.com',
  };

  document.info.license = {
    name: 'MIT',
  };

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Generate OpenAPI files in development mode
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  if (nodeEnv === 'development') {
    try {
      const rootDir = join(__dirname, '../../..');
      const outputPathJson = join(rootDir, 'openapi.json');
      const outputPathYaml = join(rootDir, 'openapi.yaml');

      // Write JSON specification
      writeFileSync(outputPathJson, JSON.stringify(document, null, 2));
      console.log(`📄 OpenAPI JSON generated: ${outputPathJson}`);

      // Convert to YAML and write
      const yaml = require('js-yaml');
      const yamlContent = yaml.dump(document, {
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });

      writeFileSync(outputPathYaml, yamlContent);
      console.log(`📄 OpenAPI YAML generated: ${outputPathYaml}`);

      // Log summary
      const paths = Object.keys(document.paths || {});
      const totalEndpoints = paths.reduce((count, path) => {
        return count + Object.keys(document.paths[path]).length;
      }, 0);

      console.log(`📊 API Summary: ${paths.length} paths, ${totalEndpoints} endpoints`);
    } catch (error) {
      console.error('⚠️  Failed to generate OpenAPI files:', error.message);
    }
  }

  // Start server
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
