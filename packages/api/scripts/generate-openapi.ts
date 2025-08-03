import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { AppModule } from '../src/app.module';

// Load environment variables from .env.spec
config({ path: join(__dirname, '../.env.spec') });

async function generateOpenApiSpec() {
  console.log('🔧 Creating NestJS application...');
  
  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: false, // Disable logging for spec generation
      }),
      {
        logger: false, // Disable all logging
      }
    );

    const configService = app.get(ConfigService);

    // Global prefix
    const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);

    console.log('📋 Building OpenAPI document...');

    // Create OpenAPI configuration
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

    // Define output paths
    const rootDir = join(__dirname, '../../..');
    const outputPath = join(rootDir, 'openapi.json');
    const outputPathYaml = join(rootDir, 'openapi.yaml');

    console.log('💾 Writing OpenAPI specification...');

    // Write JSON specification
    writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`✅ OpenAPI JSON specification generated: ${outputPath}`);

    // Convert to YAML and write
    const yaml = require('js-yaml');
    const yamlContent = yaml.dump(document, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
    
    writeFileSync(outputPathYaml, yamlContent);
    console.log(`✅ OpenAPI YAML specification generated: ${outputPathYaml}`);

    // Generate summary
    const paths = Object.keys(document.paths || {});
    const totalEndpoints = paths.reduce((count, path) => {
      return count + Object.keys(document.paths[path]).length;
    }, 0);

    console.log('\n📊 Generation Summary:');
    console.log(`   • Total API paths: ${paths.length}`);
    console.log(`   • Total endpoints: ${totalEndpoints}`);
    console.log(`   • Components defined: ${Object.keys(document.components?.schemas || {}).length}`);
    console.log(`   • Security schemes: ${Object.keys(document.components?.securitySchemes || {}).length}`);

    await app.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during app initialization:', error);
    process.exit(1);
  }
}

// Handle errors
generateOpenApiSpec().catch((error) => {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
});
