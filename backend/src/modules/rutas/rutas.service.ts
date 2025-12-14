import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';

@Injectable()
export class RutasService {
  constructor(private prisma: PrismaService) {}

  async create(createRutaDto: CreateRutaDto) {
    try {
      return await this.prisma.ruta.create({
        data: createRutaDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una ruta con ese nombre');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.ruta.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { sucursales: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const ruta = await this.prisma.ruta.findUnique({
      where: { id },
      include: {
        sucursales: {
          where: { activa: true },
          include: {
            cliente: {
              select: {
                id: true,
                razonSocial: true,
              },
            },
          },
        },
      },
    });

    if (!ruta) {
      throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
    }

    return ruta;
  }

  async update(id: string, updateRutaDto: UpdateRutaDto) {
    try {
      const ruta = await this.prisma.ruta.update({
        where: { id },
        data: updateRutaDto,
      });
      return ruta;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una ruta con ese nombre');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Soft delete
      const ruta = await this.prisma.ruta.update({
        where: { id },
        data: { activa: false },
      });
      return ruta;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
      }
      throw error;
    }
  }
}
