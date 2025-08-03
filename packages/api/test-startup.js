// Test startup script to bypass TypeScript errors
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create(AppModule);
    await app.listen(3333);
    console.log('Application is running on: http://localhost:3333');
  } catch (error) {
    console.error('Failed to start application:', error);
  }
}

bootstrap();