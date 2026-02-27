import { Module } from '@nestjs/common';
import { ProyeccionesService } from './proyecciones.service';
import { ProyeccionesController } from './proyecciones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProyeccionesController],
  providers: [ProyeccionesService],
  exports: [ProyeccionesService],
})
export class ProyeccionesModule {}
