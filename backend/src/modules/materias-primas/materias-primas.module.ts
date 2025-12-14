import { Module } from '@nestjs/common';
import { MateriasPrimasService } from './materias-primas.service';
import { MateriasPrimasController } from './materias-primas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MateriasPrimasController],
  providers: [MateriasPrimasService],
  exports: [MateriasPrimasService],
})
export class MateriasPrimasModule {}
