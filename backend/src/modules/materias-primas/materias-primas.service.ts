import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';
import { UpdateMateriaPrimaDto } from './dto/update-materia-prima.dto';

@Injectable()
export class MateriasPrimasService {
  constructor(private prisma: PrismaService) {}

  async create(createMateriaPrimaDto: CreateMateriaPrimaDto) {
    return this.prisma.materiaPrima.create({
      data: createMateriaPrimaDto,
    });
  }

  async findAll() {
    return this.prisma.materiaPrima.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const materiaPrima = await this.prisma.materiaPrima.findUnique({
      where: { id },
    });
    if (!materiaPrima) {
      throw new NotFoundException(`Materia prima con ID ${id} no encontrada`);
    }
    return materiaPrima;
  }

  async update(id: string, updateMateriaPrimaDto: UpdateMateriaPrimaDto) {
    await this.findOne(id);
    return this.prisma.materiaPrima.update({
      where: { id },
      data: updateMateriaPrimaDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.materiaPrima.delete({
      where: { id },
    });
  }
}
