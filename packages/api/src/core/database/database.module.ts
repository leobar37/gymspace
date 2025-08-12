import { Module, Global, Logger, Scope } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useClass: PrismaService,
      // Ensure singleton behavior across the entire application
      scope: Scope.DEFAULT, // This is the default, but making it explicit
    },
  ],
  exports: [PrismaService],
})
export class DatabaseModule {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor() {
    this.logger.log('DatabaseModule initialized - PrismaService will be shared globally');
  }
}
