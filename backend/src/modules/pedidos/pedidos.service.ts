import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async create(createPedidoDto: CreatePedidoDto, userId: string, userRole: string) {
    // Validate sucursal exists
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id: createPedidoDto.sucursalId },
    });

    if (!sucursal) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    // Check time and calculate fechaProduccion
    const now = new Date();
    const fueraDeHorario = this.isFueraDeHorario(now);
    const isAdmin = userRole === 'ADMIN';
    
    // Logic:
    // Admin: Always same day (even if > 11:30 AM).
    // Assistant: If > 11:30 AM, next day.
    const fechaProduccion = this.calculateFechaProduccion(now, fueraDeHorario, isAdmin);

    // Calculate montoTotal
    const montoTotal = this.calculateMontoTotal(createPedidoDto.detalles);

    // Create pedido
    const pedido = await this.prisma.pedido.create({
      data: {
        sucursalId: createPedidoDto.sucursalId,
        detalles: createPedidoDto.detalles as any,
        consignaciones: (createPedidoDto.consignaciones || []) as any,
        montoTotal,
        observaciones: createPedidoDto.observaciones,
        fueraDeHorario: fueraDeHorario && !isAdmin, // Only mark as "late" if it affects production date (Assistant)
        fechaProduccion,
        creadoPorId: userId,
      },
      include: {
        sucursal: {
          include: {
            cliente: true,
            ruta: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    // Auto-create tarea
    await this.prisma.tarea.create({
      data: {
        pedidoId: pedido.id,
        estado: 'ABIERTO',
      },
    });

    return pedido;
  }

  async findAll(filters?: {
    sucursalId?: string;
    rutaId?: string;
    fecha?: string;
  }) {
    const where: any = {};

    if (filters?.sucursalId) {
      where.sucursalId = filters.sucursalId;
    }

    if (filters?.rutaId) {
      where.sucursal = {
        rutaId: filters.rutaId,
      };
    }

    if (filters?.fecha) {
      const fecha = new Date(filters.fecha);
      const nextDay = new Date(fecha);
      nextDay.setDate(nextDay.getDate() + 1);

      where.fechaProduccion = {
        gte: fecha,
        lt: nextDay,
      };
    }

    return this.prisma.pedido.findMany({
      where,
      include: {
        sucursal: {
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
        },
        tarea: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        sucursal: {
          include: {
            cliente: true,
            ruta: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        tarea: {
          include: {
            asignadoA: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto, userId: string, isAdmin: boolean) {
    const pedido = await this.findOne(id);

    // Check if tarea is ENTREGADO
    if (pedido.tarea && pedido.tarea.estado === 'ENTREGADO_LOGISTICA') {
      throw new BadRequestException('No se puede modificar un pedido ya entregado');
    }

    // If changing fechaProduccion, check time window and permissions
    if (updatePedidoDto.fechaProduccion) {
      const now = new Date();
      const canModify = this.canModifyFechaProduccion(now, isAdmin);

      if (!canModify) {
        throw new ForbiddenException(
          'Solo ADMIN puede modificar la fecha de producción entre 11:30 AM y 6:00 AM',
        );
      }
    }

    // Recalculate montoTotal if detalles changed
    const updateData: any = { ...updatePedidoDto };
    if (updatePedidoDto.detalles) {
      updateData.montoTotal = this.calculateMontoTotal(updatePedidoDto.detalles);
    }

    return this.prisma.pedido.update({
      where: { id },
      data: updateData,
      include: {
        sucursal: {
          include: {
            cliente: true,
            ruta: true,
          },
        },
        tarea: true,
      },
    });
  }

  async remove(id: string, isAdmin: boolean) {
    const pedido = await this.findOne(id);

    if (!isAdmin) {
      throw new ForbiddenException('Solo ADMIN puede eliminar pedidos');
    }

    if (pedido.tarea && pedido.tarea.estado !== 'ABIERTO') {
      throw new BadRequestException(
        'No se puede eliminar un pedido que ya está en proceso',
      );
    }

    return this.prisma.pedido.delete({
      where: { id },
    });
  }

  // Helper methods
  private isFueraDeHorario(fecha: Date): boolean {
    const hour = fecha.getHours();
    const minutes = fecha.getMinutes();
    return hour > 11 || (hour === 11 && minutes > 30);
  }

  private calculateFechaProduccion(now: Date, fueraDeHorario: boolean, isAdmin: boolean): Date {
    const fecha = new Date(now);
    fecha.setHours(0, 0, 0, 0); // Set to start of day

    // If Admin, they can force same day production even if late (between 11:30 AM and 6:00 AM next day)
    // The requirement says: "Si el administrador agrega un pedido entre las 11:30am y las 6am del dia siguiente ese pedido entra para el mismo dia"
    // This implies Admin orders are always for "Today" unless explicitly future dated (which isn't an option yet).
    // Assistant orders move to next day if late.
    
    if (fueraDeHorario && !isAdmin) {
      // Next day
      fecha.setDate(fecha.getDate() + 1);
    }

    return fecha;
  }

  private calculateMontoTotal(detalles: any[]): number {
    return detalles.reduce((total, item) => {
      return total + item.cantidad * item.precioUnitario;
    }, 0);
  }

  private canModifyFechaProduccion(now: Date, isAdmin: boolean): boolean {
    if (!isAdmin) return false;

    const hour = now.getHours();
    // ADMIN can modify between 11:30 AM (11:30) and 6:00 AM (06:00) next day
    // This means: after 11:30 OR before 6:00
    return hour >= 11 || hour < 6;
  }
}
