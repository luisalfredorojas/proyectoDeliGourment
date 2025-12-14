import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSucursalDto: CreateSucursalDto) {
    // Validate that cliente exists
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createSucursalDto.clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(
        `Cliente con ID ${createSucursalDto.clienteId} no encontrado`,
      );
    }

    // Validate that ruta exists
    const ruta = await this.prisma.ruta.findUnique({
      where: { id: createSucursalDto.rutaId },
    });

    if (!ruta) {
      throw new NotFoundException(
        `Ruta con ID ${createSucursalDto.rutaId} no encontrada`,
      );
    }

    return await this.prisma.sucursal.create({
      data: createSucursalDto,
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: [{ cliente: { razonSocial: 'asc' } }, { nombre: 'asc' }],
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async findByCliente(clienteId: string) {
    return this.prisma.sucursal.findMany({
      where: {
        clienteId,
        activa: true,
      },
      include: {
        ruta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async findByRuta(rutaId: string) {
    return this.prisma.sucursal.findMany({
      where: {
        rutaId,
        activa: true,
      },
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
            ruc: true,
            direccion: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });

    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    return sucursal;
  }

  async update(id: string, updateSucursalDto: UpdateSucursalDto) {
    // Validate sucursal exists
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id },
    });

    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    // Validate cliente if changing
    if (updateSucursalDto.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: updateSucursalDto.clienteId },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${updateSucursalDto.clienteId} no encontrado`,
        );
      }
    }

    // Validate ruta if changing
    if (updateSucursalDto.rutaId) {
      const ruta = await this.prisma.ruta.findUnique({
        where: { id: updateSucursalDto.rutaId },
      });

      if (!ruta) {
        throw new NotFoundException(
          `Ruta con ID ${updateSucursalDto.rutaId} no encontrada`,
        );
      }
    }

    return await this.prisma.sucursal.update({
      where: { id },
      data: updateSucursalDto,
      include: {
        cliente: {
          select: {
            id: true,
            razonSocial: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id },
    });

    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    // Soft delete
    return await this.prisma.sucursal.update({
      where: { id },
      data: { activa: false },
    });
  }
}
