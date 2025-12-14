import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(createClienteDto: CreateClienteDto) {
    try {
      return await this.prisma.cliente.create({
        data: createClienteDto,
        include: {
          _count: {
            select: { sucursales: true },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un cliente con ese CI/RUC');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { razonSocial: 'asc' },
      include: {
        _count: {
          select: { sucursales: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        sucursales: {
          where: { activa: true },
          include: {
            ruta: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async update(id: string, updateClienteDto: UpdateClienteDto) {
    try {
      const cliente = await this.prisma.cliente.update({
        where: { id },
        data: updateClienteDto,
        include: {
          _count: {
            select: { sucursales: true },
          },
        },
      });
      return cliente;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un cliente con ese CI/RUC');
      }
      throw error;
    }
  }

  async remove(id: string) {
    // Check if client has active sucursales
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sucursales: true },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    if (cliente._count.sucursales > 0) {
      throw new BadRequestException(
        `No se puede eliminar el cliente porque tiene ${cliente._count.sucursales} sucursal(es) asociada(s)`,
      );
    }

    try {
      // Soft delete
      const deletedCliente = await this.prisma.cliente.update({
        where: { id },
        data: { activo: false },
      });
      return deletedCliente;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }
      throw error;
    }
  }
}
