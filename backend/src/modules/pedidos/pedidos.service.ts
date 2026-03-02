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
    const esProyeccion = createPedidoDto.esProyeccion || false;

    // Validate sucursal exists (only required for non-projection orders)
    let sucursal: { id: string; clienteId: string } | null = null;
    if (!esProyeccion) {
      if (!createPedidoDto.sucursalId) {
        throw new BadRequestException('Debe seleccionar una sucursal para pedidos normales');
      }
      sucursal = await this.prisma.sucursal.findUnique({
        where: { id: createPedidoDto.sucursalId },
        select: { id: true, clienteId: true },
      });
      if (!sucursal) {
        throw new NotFoundException('Sucursal no encontrada');
      }
    }

    // Validate consignment-only orders
    const soloConsignaciones = createPedidoDto.soloConsignaciones || false;

    // Projection orders cannot have consignaciones
    if (esProyeccion && createPedidoDto.consignaciones && createPedidoDto.consignaciones.length > 0) {
      throw new BadRequestException('Un pedido de proyección no puede tener consignaciones.');
    }
    if (esProyeccion && soloConsignaciones) {
      throw new BadRequestException('Un pedido no puede ser proyección y solo consignaciones al mismo tiempo.');
    }

    if (soloConsignaciones) {
      // If it's consignment-only, detalles must be empty and consignaciones must have at least 1 item
      if (createPedidoDto.detalles && createPedidoDto.detalles.length > 0) {
        throw new BadRequestException(
          'Un pedido de solo consignaciones no puede tener productos regulares. Deseleccione productos o desactive "Solo Consignaciones".',
        );
      }
      if (!createPedidoDto.consignaciones || createPedidoDto.consignaciones.length === 0) {
        throw new BadRequestException(
          'Un pedido de solo consignaciones debe tener al menos una consignación.',
        );
      }
    } else {
      // If it's a regular order, detalles must have at least 1 item
      if (!createPedidoDto.detalles || createPedidoDto.detalles.length === 0) {
        throw new BadRequestException(
          'Un pedido regular debe tener al menos un producto.',
        );
      }
    }

    // Check time and calculate fechaProduccion
    const now = new Date();
    const fueraDeHorario = this.isFueraDeHorario(now);
    const isAdmin = userRole === 'ADMIN';

    // Logic:
    // Admin: Always same day (even if > 11:30 AM).
    // Assistant: If > 11:30 AM, next day.
    const fechaProduccion = this.calculateFechaProduccion(now, fueraDeHorario, isAdmin);

    // Resolve prices from ClienteProducto catalog (ignore frontend prices for regular orders)
    let resolvedDetalles = createPedidoDto.detalles || [];
    if (!esProyeccion && sucursal && resolvedDetalles.length > 0) {
      const productoIds = resolvedDetalles
        .map((d: any) => d.productoId)
        .filter(Boolean) as string[];

      const catalogoMap = new Map<string, number>();
      if (productoIds.length > 0) {
        const catalogoItems = await this.prisma.clienteProducto.findMany({
          where: { clienteId: sucursal.clienteId, productoId: { in: productoIds } },
          select: { productoId: true, precio: true },
        });
        catalogoItems.forEach((item) => {
          catalogoMap.set(item.productoId, Number(item.precio));
        });
      }

      resolvedDetalles = resolvedDetalles.map((d: any) => ({
        ...d,
        precioUnitario: d.productoId && catalogoMap.has(d.productoId)
          ? catalogoMap.get(d.productoId)
          : d.precioUnitario,
      }));
    }

    // Calculate montoTotal based on order type
    const montoTotal = this.calculateMontoTotal(
      resolvedDetalles,
      createPedidoDto.consignaciones || [],
      soloConsignaciones,
    );

    // Create pedido
    const pedido = await this.prisma.pedido.create({
      data: {
        sucursalId: createPedidoDto.sucursalId,
        detalles: resolvedDetalles as any,
        consignaciones: (createPedidoDto.consignaciones || []) as any,
        montoTotal,
        observaciones: createPedidoDto.observaciones,
        fueraDeHorario: fueraDeHorario && !isAdmin, // Only mark as "late" if it affects production date (Assistant)
        soloConsignaciones,
        esProyeccion,
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
    const tarea = await this.prisma.tarea.create({
      data: {
        pedidoId: pedido.id,
        estado: 'ABIERTO',
      },
    });

    // Auto-create per-product state tracking entries
    const detalles = (createPedidoDto.detalles || []) as any[];
    if (detalles.length > 0) {
      const productNames = detalles.map((d: any) => d.producto).filter(Boolean);
      const productos = await this.prisma.producto.findMany({
        where: { nombre: { in: productNames } },
        select: { id: true, nombre: true },
      });
      const productoMap = new Map(productos.map((p) => [p.nombre, p.id]));

      await this.prisma.tareaProductoEstado.createMany({
        data: detalles.map((detalle: any) => ({
          tareaId: tarea.id,
          productoNombre: detalle.producto || 'Sin nombre',
          productoId: productoMap.get(detalle.producto) || null,
          cantidad: detalle.cantidad || 0,
          estado: 'PENDIENTE',
        })),
        skipDuplicates: true,
      });
    }

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

    // Block edit if tarea is in an advanced state
    const ESTADOS_NO_EDITABLES = ['EMBALAJE', 'LOGISTICA', 'ENTREGADO'];
    if (pedido.tarea && ESTADOS_NO_EDITABLES.includes(pedido.tarea.estado)) {
      throw new BadRequestException(
        `No se puede modificar un pedido en estado: ${pedido.tarea.estado.replace(/_/g, ' ')}`,
      );
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

    // Recalculate montoTotal if detalles or consignaciones changed
    const updateData: any = { ...updatePedidoDto };

    // Convert manually-provided fechaProduccion string to Ecuador midnight UTC
    if (updateData.fechaProduccion) {
      const [year, month, day] = String(updateData.fechaProduccion).substring(0, 10).split('-').map(Number);
      updateData.fechaProduccion = this.ecuadorMidnightUTC(year, month - 1, day);
    }
    if (updatePedidoDto.detalles || updatePedidoDto.consignaciones || updatePedidoDto.soloConsignaciones !== undefined) {
      const soloConsignaciones = updatePedidoDto.soloConsignaciones ?? pedido.soloConsignaciones ?? false;
      updateData.montoTotal = this.calculateMontoTotal(
        updatePedidoDto.detalles || (pedido.detalles as any) || [],
        updatePedidoDto.consignaciones || (pedido.consignaciones as any) || [],
        soloConsignaciones,
      );
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

    // REGLA: Solo se puede eliminar si la tarea está en ABIERTO
    if (pedido.tarea && pedido.tarea.estado !== 'ABIERTO') {
      throw new BadRequestException(
        `No se puede eliminar un pedido con tarea en estado: ${pedido.tarea.estado.replace(/_/g, ' ')}. Solo se pueden eliminar pedidos con tareas en estado ABIERTO.`,
      );
    }

    // Eliminar la tarea primero (si existe)
    if (pedido.tarea) {
      await this.prisma.tarea.delete({
        where: { id: pedido.tarea.id },
      });
    }

    // Eliminar el pedido
    return this.prisma.pedido.delete({
      where: { id },
    });
  }

  // Helper methods

  // Ecuador/Guayaquil is UTC-5 (no daylight saving time).
  // Returns the current moment expressed in Ecuador local time components.
  private getEcuadorDateParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
    const ECUADOR_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC-5
    const local = new Date(date.getTime() + ECUADOR_OFFSET_MS);
    return {
      year: local.getUTCFullYear(),
      month: local.getUTCMonth(),
      day: local.getUTCDate(),
      hour: local.getUTCHours(),
      minute: local.getUTCMinutes(),
    };
  }

  // Returns a Date representing midnight Ecuador time for the given calendar date parts,
  // stored as the equivalent UTC timestamp (Ecuador midnight = UTC 05:00).
  private ecuadorMidnightUTC(year: number, month: number, day: number): Date {
    const ECUADOR_OFFSET_HOURS = 5; // hours to add to UTC to reach Ecuador midnight
    return new Date(Date.UTC(year, month, day, ECUADOR_OFFSET_HOURS, 0, 0, 0));
  }

  private isFueraDeHorario(fecha: Date): boolean {
    const { hour, minute } = this.getEcuadorDateParts(fecha);
    return hour > 11 || (hour === 11 && minute > 30);
  }

  private calculateFechaProduccion(now: Date, fueraDeHorario: boolean, isAdmin: boolean): Date {
    let { year, month, day } = this.getEcuadorDateParts(now);

    // If Admin, they can force same day production even if late (between 11:30 AM and 6:00 AM next day)
    // The requirement says: "Si el administrador agrega un pedido entre las 11:30am y las 6am del dia siguiente ese pedido entra para el mismo dia"
    // This implies Admin orders are always for "Today" unless explicitly future dated (which isn't an option yet).
    // Assistant orders move to next day if late.

    if (fueraDeHorario && !isAdmin) {
      // Advance one calendar day in Ecuador
      const nextDay = new Date(Date.UTC(year, month, day + 1));
      year = nextDay.getUTCFullYear();
      month = nextDay.getUTCMonth();
      day = nextDay.getUTCDate();
    }

    // Store as Ecuador midnight expressed in UTC (UTC-5 → +5h offset)
    return this.ecuadorMidnightUTC(year, month, day);
  }

  private calculateMontoTotal(
    detalles: any[],
    consignaciones: any[],
    soloConsignaciones: boolean,
  ): number {
    if (soloConsignaciones) {
      // For consignment-only orders, calculate total from consignaciones
      return consignaciones.reduce((total, item) => {
        return total + (item.cantidad * item.precioUnitario || 0);
      }, 0);
    } else {
      // For regular orders, calculate total from detalles
      return detalles.reduce((total, item) => {
        return total + (item.cantidad * item.precioUnitario || 0);
      }, 0);
    }
  }

  private canModifyFechaProduccion(now: Date, isAdmin: boolean): boolean {
    if (!isAdmin) return false;

    const { hour } = this.getEcuadorDateParts(now);
    // ADMIN can modify between 11:30 AM (11:30) and 6:00 AM (06:00) next day Ecuador time
    // This means: after 11:30 OR before 6:00
    return hour >= 11 || hour < 6;
  }
}
