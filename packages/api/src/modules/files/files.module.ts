import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaService } from '../../core/database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, PrismaService, StorageService],
  exports: [FilesService],
})
export class FilesModule {}