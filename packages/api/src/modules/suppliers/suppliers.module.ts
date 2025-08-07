import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { DatabaseModule } from '../../core/database/database.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}