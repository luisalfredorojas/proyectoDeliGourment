import { Module } from '@nestjs/common';
import { TareasService } from './tareas.service';
import { TareasController } from './tareas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [PrismaModule, InventarioModule],
  controllers: [TareasController],
  providers: [TareasService],
  exports: [TareasService],
})
export class TareasModule {}
