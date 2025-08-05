import * as dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();


import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './commands/commands.module';
console.log('das');
async function bootstrap() {
  console.log('🚀 Starting CLI...');
  try {
    console.log('hello workd');
    await CommandFactory.run(CommandsModule, ['log', 'error', 'warn', 'debug']);
  } catch (error) {
    console.error('❌ CLI Error:', error);
    process.exit(1);
  }
}

bootstrap()
  .then((d) => {
    console.log('d');
  })
  .catch((error) => {
    console.error('❌ Bootstrap Error:', error);
    process.exit(1);
  });
