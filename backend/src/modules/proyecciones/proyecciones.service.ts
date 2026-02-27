import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoProyeccion, OrigenProyeccion } from '@prisma/client';
import {
  CrearProyeccionDto,
  ActualizarProyeccionDto,
  CambiarEstadoProyeccionDto,
  CuadrarProyeccionDto,
} from './dto/proyecciones.dto';

@Injectable()
export class ProyeccionesService {
  private readonly logger = new Logger(ProyeccionesService.name);

  constructor(private prisma: PrismaService) {}

  // ========== CRUD ==========

  async findAll(filters?: { fecha?: string; estado?: EstadoProyeccion }) {
    const where: any = {};
    if (filters?.estado) {
      where.estado = filters.estado;
    }
    if (filters?.fecha) {
      const fecha = new Date(filters.fecha);
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      where.fechaProduccion = { gte: inicio, lte: fin };
    }

    return this.prisma.proyeccion.findMany({
      where,
      orderBy: { fechaProduccion: 'desc' },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
        tarea: { select: { id: true, estado: true } },
        _count: { select: { cuadres: true } },
      },
    });
  }

  async findOne(id: string) {
    const proyeccion = await this.prisma.proyeccion.findUnique({
      where: { id },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
        tarea: {
          include: {
            pedido: {
              include: {
                sucursal: { include: { cliente: true } },
              },
            },
          },
        },
        cuadres: {
          include: {
            pedido: {
              include: {
                sucursal: { include: { cliente: true } },
              },
            },
          },
        },
      },
    });

    if (!proyeccion) {
      throw new NotFoundException('Proyección no encontrada');
    }

    return proyeccion;
  }

  async crear(dto: CrearProyeccionDto, userId: string) {
    return this.prisma.proyeccion.create({
      data: {
        fechaProduccion: new Date(dto.fechaProduccion),
        detalles: dto.detalles as any,
        origen: dto.origen || OrigenProyeccion.MANUAL,
        observaciones: dto.observaciones,
        creadoPorId: userId,
      },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
      },
    });
  }

  async actualizar(id: string, dto: ActualizarProyeccionDto) {
    const proyeccion = await this.findOne(id);

    if (
      proyeccion.estado === EstadoProyeccion.CUADRADA ||
      proyeccion.estado === EstadoProyeccion.CANCELADA
    ) {
      throw new BadRequestException(
        'No se puede editar una proyección cuadrada o cancelada',
      );
    }

    const data: any = {};
    if (dto.detalles) data.detalles = dto.detalles;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    return this.prisma.proyeccion.update({
      where: { id },
      data,
      include: {
        creadoPor: { select: { id: true, nombre: true } },
      },
    });
  }

  async cambiarEstado(id: string, dto: CambiarEstadoProyeccionDto) {
    const proyeccion = await this.findOne(id);

    // Validate state transitions
    const transicionesValidas: Record<EstadoProyeccion, EstadoProyeccion[]> = {
      [EstadoProyeccion.BORRADOR]: [
        EstadoProyeccion.PENDIENTE,
        EstadoProyeccion.CANCELADA,
      ],
      [EstadoProyeccion.PENDIENTE]: [
        EstadoProyeccion.EN_PRODUCCION,
        EstadoProyeccion.CANCELADA,
      ],
      [EstadoProyeccion.EN_PRODUCCION]: [
        EstadoProyeccion.CUADRADA,
        EstadoProyeccion.CANCELADA,
      ],
      [EstadoProyeccion.CUADRADA]: [],
      [EstadoProyeccion.CANCELADA]: [],
    };

    const permitidos = transicionesValidas[proyeccion.estado] || [];
    if (!permitidos.includes(dto.nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${proyeccion.estado} a ${dto.nuevoEstado}`,
      );
    }

    return this.prisma.proyeccion.update({
      where: { id },
      data: { estado: dto.nuevoEstado },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
      },
    });
  }

  // ========== Confirmar (BORRADOR → PENDIENTE) ==========

  /**
   * Confirm a draft projection: moves to PENDIENTE and creates a gray task in Kanban.
   */
  async confirmar(id: string, userId: string) {
    const proyeccion = await this.findOne(id);

    if (proyeccion.estado !== EstadoProyeccion.BORRADOR) {
      throw new BadRequestException(
        'Solo se pueden confirmar proyecciones en estado BORRADOR',
      );
    }

    // Create a "virtual" pedido for this projection so we can create a tarea
    const detalles = (proyeccion.detalles as any[]) || [];
    const montoTotal = detalles.reduce(
      (acc: number, d: any) => acc + (d.cantidad || 0) * (d.precioUnitario || 0),
      0,
    );

    // Find a default sucursal for the projection pedido
    const sucursal = await this.prisma.sucursal.findFirst({
      select: { id: true },
    });

    if (!sucursal) {
      throw new BadRequestException(
        'No hay sucursales registradas para crear la tarea de proyección',
      );
    }

    // Transaction: Create pedido + tarea + update projection
    const result = await this.prisma.$transaction(async (tx) => {
      // Create a pedido for this projection
      const pedido = await tx.pedido.create({
        data: {
          sucursalId: sucursal.id,
          fechaProduccion: proyeccion.fechaProduccion,
          detalles: proyeccion.detalles as any,
          montoTotal,
          observaciones: `[PROYECCIÓN] ${proyeccion.observaciones || ''}`,
          creadoPorId: userId,
        },
      });

      // Create a tarea linked to the projection
      const tarea = await tx.tarea.create({
        data: {
          pedidoId: pedido.id,
          estado: 'ABIERTO',
          proyeccionId: id,
        },
      });

      // Create per-product states for the tarea
      if (detalles.length > 0) {
        const productNames = detalles
          .map((d: any) => d.producto)
          .filter(Boolean);
        const productos = await tx.producto.findMany({
          where: { nombre: { in: productNames } },
          select: { id: true, nombre: true },
        });
        const productoMap = new Map(
          productos.map((p) => [p.nombre, p.id]),
        );

        await tx.tareaProductoEstado.createMany({
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

      // Update projection state
      const updated = await tx.proyeccion.update({
        where: { id },
        data: { estado: EstadoProyeccion.PENDIENTE },
        include: {
          creadoPor: { select: { id: true, nombre: true } },
          tarea: { select: { id: true, estado: true } },
        },
      });

      return updated;
    });

    return result;
  }

  // ========== Cuadre (reconciliación) ==========

  async cuadrar(id: string, dto: CuadrarProyeccionDto) {
    const proyeccion = await this.findOne(id);

    if (
      proyeccion.estado !== EstadoProyeccion.EN_PRODUCCION &&
      proyeccion.estado !== EstadoProyeccion.PENDIENTE
    ) {
      throw new BadRequestException(
        'Solo se pueden cuadrar proyecciones en estado PENDIENTE o EN_PRODUCCION',
      );
    }

    // Verify all pedidos exist
    const pedidos = await this.prisma.pedido.findMany({
      where: { id: { in: dto.pedidoIds } },
    });

    if (pedidos.length !== dto.pedidoIds.length) {
      throw new BadRequestException('Algunos pedidos no fueron encontrados');
    }

    // Transaction: create cuadres + update state
    const result = await this.prisma.$transaction(async (tx) => {
      // Create cuadre records
      await tx.cuadreProyeccion.createMany({
        data: dto.pedidoIds.map((pedidoId) => ({
          proyeccionId: id,
          pedidoId,
          observaciones: dto.observaciones,
        })),
        skipDuplicates: true,
      });

      // Update projection state to CUADRADA
      return tx.proyeccion.update({
        where: { id },
        data: { estado: EstadoProyeccion.CUADRADA },
        include: {
          creadoPor: { select: { id: true, nombre: true } },
          cuadres: {
            include: {
              pedido: {
                include: {
                  sucursal: { include: { cliente: true } },
                },
              },
            },
          },
        },
      });
    });

    return result;
  }

  // ========== Cuadre summary ==========

  async getResumenCuadre(id: string) {
    const proyeccion = await this.findOne(id);
    const detallesProyeccion = (proyeccion.detalles as any[]) || [];

    // Get all pedidos for the same date
    const inicio = new Date(proyeccion.fechaProduccion);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(proyeccion.fechaProduccion);
    fin.setHours(23, 59, 59, 999);

    const pedidosDelDia = await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: { gte: inicio, lte: fin },
      },
      include: {
        sucursal: { include: { cliente: true } },
      },
    });

    // Aggregate real quantities per product
    const realPorProducto: Record<string, number> = {};
    for (const pedido of pedidosDelDia) {
      const detalles = (pedido.detalles as any[]) || [];
      for (const d of detalles) {
        if (d.producto) {
          realPorProducto[d.producto] =
            (realPorProducto[d.producto] || 0) + (d.cantidad || 0);
        }
      }
    }

    // Compare projected vs real
    const comparacion = detallesProyeccion.map((dp: any) => {
      const cantidadReal = realPorProducto[dp.producto] || 0;
      const diferencia = cantidadReal - (dp.cantidad || 0);
      return {
        producto: dp.producto,
        cantidadProyectada: dp.cantidad || 0,
        cantidadReal,
        diferencia,
        porcentaje:
          dp.cantidad > 0
            ? Math.round((cantidadReal / dp.cantidad) * 100)
            : 0,
      };
    });

    return {
      proyeccion: {
        id: proyeccion.id,
        fecha: proyeccion.fechaProduccion,
        estado: proyeccion.estado,
      },
      totalPedidosDelDia: pedidosDelDia.length,
      comparacion,
      pedidosDisponibles: pedidosDelDia.map((p) => ({
        id: p.id,
        sucursal: (p.sucursal as any)?.nombre,
        cliente: (p.sucursal as any)?.cliente?.razonSocial,
        montoTotal: p.montoTotal,
        detalles: p.detalles,
      })),
    };
  }

  // ========== Motor de Tendencias ==========

  /**
   * Analyze historical orders for the same day of week and generate
   * average quantities per product.
   */
  async generarSugerencia(fecha: Date) {
    const diaSemana = fecha.getDay(); // 0=Sunday, 6=Saturday

    // Look at pedidos from the same day of week in the last 4 weeks
    const cuatroSemanasAtras = new Date(fecha);
    cuatroSemanasAtras.setDate(cuatroSemanasAtras.getDate() - 28);

    const pedidosHistoricos = await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: { gte: cuatroSemanasAtras, lt: fecha },
      },
    });

    // Filter to same day of week
    const pedidosMismoDia = pedidosHistoricos.filter(
      (p) => p.fechaProduccion.getDay() === diaSemana,
    );

    if (pedidosMismoDia.length === 0) {
      return null; // No historical data
    }

    // Aggregate quantities per product
    const productoCantidad: Record<string, number[]> = {};
    for (const pedido of pedidosMismoDia) {
      const detalles = (pedido.detalles as any[]) || [];
      for (const d of detalles) {
        if (d.producto && d.cantidad) {
          if (!productoCantidad[d.producto]) {
            productoCantidad[d.producto] = [];
          }
          productoCantidad[d.producto].push(d.cantidad);
        }
      }
    }

    // Calculate averages
    const detalles = Object.entries(productoCantidad).map(
      ([producto, cantidades]) => ({
        producto,
        cantidad: Math.ceil(
          cantidades.reduce((a, b) => a + b, 0) / cantidades.length,
        ),
        precioUnitario: 0,
      }),
    );

    return {
      fechaProduccion: fecha,
      detalles,
      semanasAnalizadas: Math.ceil(pedidosMismoDia.length / 1), // pedidos on same weekday
      totalPedidosAnalizados: pedidosMismoDia.length,
    };
  }

  // ========== Cron Job: Generar proyección nocturna ==========

  @Cron('0 22 * * *') // 10 PM every night
  async cronGenerarProyeccion() {
    this.logger.log('🕐 Cron: generando proyección automática...');

    try {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      manana.setHours(0, 0, 0, 0);

      // Check if a projection already exists for tomorrow
      const existente = await this.prisma.proyeccion.findFirst({
        where: {
          fechaProduccion: {
            gte: manana,
            lt: new Date(manana.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existente) {
        this.logger.log('📋 Ya existe una proyección para mañana, saltando');
        return;
      }

      const sugerencia = await this.generarSugerencia(manana);

      if (!sugerencia || sugerencia.detalles.length === 0) {
        this.logger.log('📊 No hay datos históricos suficientes para sugerir');
        return;
      }

      // Find admin user to set as creator
      const admin = await this.prisma.user.findFirst({
        where: { rol: 'ADMIN', activo: true },
      });

      if (!admin) {
        this.logger.warn('⚠️ No se encontró usuario admin para crear la proyección');
        return;
      }

      const proyeccion = await this.prisma.proyeccion.create({
        data: {
          fechaProduccion: manana,
          detalles: sugerencia.detalles as any,
          origen: OrigenProyeccion.AUTOMATICA,
          estado: EstadoProyeccion.BORRADOR,
          observaciones: `Generada automáticamente: ${sugerencia.totalPedidosAnalizados} pedidos analizados`,
          creadoPorId: admin.id,
        },
      });

      this.logger.log(`✅ Proyección creada: ${proyeccion.id} con ${sugerencia.detalles.length} productos`);
    } catch (error) {
      this.logger.error('❌ Error en cron de proyecciones:', error);
    }
  }

  // ========== Manual trigger for trend analysis ==========

  async getSugerenciaParaFecha(fecha: string) {
    return this.generarSugerencia(new Date(fecha));
  }
}
