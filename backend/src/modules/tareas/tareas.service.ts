import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventarioService } from '../inventario/inventario.service';
import { TareaEstado, EstadoProductoEnTarea } from '@prisma/client';
import { CambiarEstadoDto, AsignarTareaDto, AddComentarioDto, CambiarEstadoProductoDto, TipoComentario } from './dto/tarea.dto';

@Injectable()
export class TareasService {
  constructor(
    private prisma: PrismaService,
    private inventarioService: InventarioService,
  ) {}

  async findAll(filters?: {
    estado?: TareaEstado;
    asignadoId?: string;
    rutaId?: string;
    fecha?: string;
  }) {
    const where: any = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.asignadoId) {
      where.asignadoAId = filters.asignadoId;
    }

    if (filters?.rutaId) {
      where.pedido = {
        sucursal: {
          rutaId: filters.rutaId,
        },
      };
    }

    if (filters?.fecha) {
      const fecha = new Date(filters.fecha);
      const nextDay = new Date(fecha);
      nextDay.setDate(nextDay.getDate() + 1);

      where.pedido = {
        ...where.pedido,
        fechaProduccion: {
          gte: fecha,
          lt: nextDay,
        },
      };
    }

    return this.prisma.tarea.findMany({
      where,
      include: {
        pedido: {
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
          },
        },
        asignadoA: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        productosEstado: {
          orderBy: { productoNombre: 'asc' },
        },
        _count: {
          select: {
            comentarios: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });
  }

  async findByEstado(estado: TareaEstado) {
    return this.findAll({ estado });
  }

  async findOne(id: string) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
      include: {
        pedido: {
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
        },
        asignadoA: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: {
            fecha: 'desc',
          },
          take: 5, // Last 5 for quick view
        },
        historialEstados: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: {
            fecha: 'desc',
          },
          take: 5, // Last 5 for quick view
        },
        productosEstado: {
          orderBy: { productoNombre: 'asc' },
        },
      },
    });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return tarea;
  }

  async cambiarEstado(
    id: string,
    cambiarEstadoDto: CambiarEstadoDto,
    userId: string,
    userRole: string,
  ) {
    const tarea = await this.findOne(id);

    // Cannot change state if already ENTREGADO
    if (tarea.estado === TareaEstado.ENTREGADO) {
      throw new BadRequestException(
        'No se puede cambiar el estado de una tarea ya entregada',
      );
    }

    // Check time-based permissions
    const now = new Date();
    
    // DEBUG: Log the role to see what we're getting
    console.log('🔍 DEBUG - cambiarEstado:', {
      userRole,
      normalizedRole: userRole?.toUpperCase(),
      currentTime: now.toLocaleTimeString(),
    });
    
    const canEdit = this.canEditTarea(now, userRole);
    
    if (!canEdit) {
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      throw new BadRequestException(
        `No tiene permisos para editar tareas en este horario (${currentTime}). ASISTENTE y PRODUCCION solo pueden editar entre 6:00 AM y 11:30 AM. Rol actual: ${userRole}`,
      );
    }

    // Update estado
    const tareaActualizada = await this.prisma.tarea.update({
      where: { id },
      data: {
        estado: cambiarEstadoDto.nuevoEstado,
      },
      include: {
        pedido: {
          include: {
            sucursal: {
              include: {
                cliente: true,
                ruta: true,
              },
            },
          },
        },
      },
    });

    // Log estado change
    await this.prisma.historialEstado.create({
      data: {
        tareaId: id,
        estadoAnterior: tarea.estado,
        estadoNuevo: cambiarEstadoDto.nuevoEstado,
        usuarioId: userId,
        comentario: cambiarEstadoDto.comentario,
      },
    });

    // Handle product inventory on state transitions
    const esProyeccion = tarea.pedido?.esProyeccion || false;
    const productosEstado = tarea.productosEstado || [];

    // LOGISTICA: deduct raw materials (production step) — applies to all orders
    if (
      cambiarEstadoDto.nuevoEstado === TareaEstado.LOGISTICA &&
      tarea.estado !== TareaEstado.LOGISTICA
    ) {
      for (const pe of productosEstado) {
        try {
          await this.inventarioService.deducirMateriaPrimaPorProducto(
            pe.productoNombre,
            pe.cantidad,
            id,
            userId,
          );
        } catch (error) {
          console.warn(`⚠️ Raw material deduction failed for ${pe.productoNombre}: ${error.message}`);
        }
      }
    }

    // ENTREGADO: handle product stock
    if (cambiarEstadoDto.nuevoEstado === TareaEstado.ENTREGADO) {
      for (const pe of productosEstado) {
        try {
          if (esProyeccion) {
            // Projection orders: ADD product stock (production completed for inventory)
            await this.inventarioService.sumarProductoAlInventario(
              pe.productoNombre,
              pe.cantidad,
              id,
              userId,
            );
          } else {
            // Normal orders: DEDUCT product stock (products leave warehouse)
            await this.inventarioService.deducirProductoDelInventario(
              pe.productoNombre,
              pe.cantidad,
              id,
              userId,
            );
          }
        } catch (error) {
          console.warn(`⚠️ Product stock update failed for ${pe.productoNombre}: ${error.message}`);
        }
      }

      // ENTREGADO (non-projection): process consignaciones
      // - Deduct replenishment products going out to client (SALIDA)
      // - Register returned products as MERMA (informational, does not affect sellable stock)
      if (!esProyeccion) {
        const consignaciones = (tarea.pedido as any)?.consignaciones;
        if (Array.isArray(consignaciones) && consignaciones.length > 0) {
          for (const consig of consignaciones) {
            try {
              // Deduct from inventory: new products going out to client
              await this.inventarioService.deducirProductoPorConsignacion(
                consig.producto,
                consig.cantidad,
                id,
                userId,
              );
            } catch (error) {
              console.warn(`⚠️ Consignación deduction failed for ${consig.producto}: ${error.message}`);
            }

            try {
              // Register MERMA: returned products from client (not sellable, for internal use)
              await this.inventarioService.registrarMermaConsignacion(
                consig.producto,
                consig.cantidad,
                id,
                userId,
              );
            } catch (error) {
              console.warn(`⚠️ MERMA registration failed for ${consig.producto}: ${error.message}`);
            }
          }
        }
      }
    }

    return tareaActualizada;
  }

  private canEditTarea(now: Date, userRole: string): boolean {
    // Normalize role to uppercase for comparison
    const normalizedRole = userRole?.toUpperCase();
    
    // ADMIN can edit anytime
    if (normalizedRole === 'ADMIN') {
      return true;
    }

    // ASISTENTE and PRODUCCION can only edit between 6:00 AM and 11:30 AM
    if (normalizedRole === 'ASISTENTE' || normalizedRole === 'PRODUCCION') {
      const hour = now.getHours();
      const minutes = now.getMinutes();
      
      // Between 6:00 AM and 11:30 AM
      return (hour > 6 || (hour === 6 && minutes >= 0)) && 
             (hour < 11 || (hour === 11 && minutes <= 30));
    }

    // Other roles cannot edit
    return false;
  }

  async asignar(id: string, asignarTareaDto: AsignarTareaDto, userId: string) {
    // Verify user exists and is PRODUCCION
    const usuario = await this.prisma.user.findUnique({
      where: { id: asignarTareaDto.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.rol !== 'PRODUCCION') {
      throw new BadRequestException(
        'Solo se puede asignar a usuarios de PRODUCCION',
      );
    }

    const tarea = await this.prisma.tarea.update({
      where: { id },
      data: {
        asignadoAId: asignarTareaDto.usuarioId,
      },
      include: {
        asignadoA: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Log assignment as comment
    await this.addComentario(id, {
      comentario: `Tarea asignada a ${usuario.nombre}`,
      tipo: 'GENERAL' as TipoComentario,
    }, userId);

    return tarea;
  }

  async addComentario(
    tareaId: string,
    addComentarioDto: AddComentarioDto,
    userId: string,
  ) {
    // Verify tarea exists
    await this.findOne(tareaId);

    return this.prisma.comentarioTarea.create({
      data: {
        tareaId,
        usuarioId: userId,
        comentario: addComentarioDto.comentario,
        tipo: addComentarioDto.tipo || 'GENERAL',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async getHistorialCompleto(tareaId: string) {
    const [comentarios, historial] = await Promise.all([
      this.prisma.comentarioTarea.findMany({
        where: { tareaId },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.historialEstado.findMany({
        where: { tareaId },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
      }),
    ]);

    // Combine and sort by date
    const combined = [
      ...comentarios.map((c) => ({
        tipo: 'comentario' as const,
        fecha: c.fecha,
        usuario: c.usuario,
        data: c,
      })),
      ...historial.map((h) => ({
        tipo: 'historial' as const,
        fecha: h.fecha,
        usuario: h.usuario,
        data: h,
      })),
    ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    return combined;
  }

  async cancelarTarea(id: string, userId: string) {
    const tarea = await this.findOne(id);

    // No se puede cancelar si ya está entregada
    if (tarea.estado === 'ENTREGADO') {
      throw new BadRequestException(
        'No se puede cancelar una tarea ya entregada',
      );
    }

    // No se puede cancelar si ya está cancelada
    if (tarea.estado === 'CANCELADO') {
      throw new BadRequestException('La tarea ya está cancelada');
    }

    return this.prisma.tarea.update({
      where: { id },
      data: {
        estado: 'CANCELADO',
        historialEstados: {
          create: {
            estadoAnterior: tarea.estado,
            estadoNuevo: 'CANCELADO',
            usuarioId: userId,
          },
        },
      },
      include: {
        pedido: {
          include: {
            sucursal: {
              include: {
                cliente: true,
                ruta: true,
              },
            },
          },
        },
        asignadoA: true,
      },
    });
  }

  // ========== Per-product state management ==========

  /**
   * Auto-create TareaProductoEstado entries for a tarea based on its pedido detalles.
   * Called after the tarea is created.
   */
  async createProductosEstado(tareaId: string) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id: tareaId },
      include: {
        pedido: {
          select: { detalles: true },
        },
      },
    });

    if (!tarea || !tarea.pedido) return;

    const detalles = tarea.pedido.detalles as any[];
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) return;

    // Look up product IDs by name
    const productNames = detalles.map((d: any) => d.producto).filter(Boolean);
    const productos = await this.prisma.producto.findMany({
      where: { nombre: { in: productNames } },
      select: { id: true, nombre: true },
    });
    const productoMap = new Map(productos.map((p) => [p.nombre, p.id]));

    // Create one TareaProductoEstado per product in the order
    const data = detalles.map((detalle: any) => ({
      tareaId,
      productoNombre: detalle.producto || 'Sin nombre',
      productoId: productoMap.get(detalle.producto) || null,
      cantidad: detalle.cantidad || 0,
      estado: EstadoProductoEnTarea.PENDIENTE,
    }));

    await this.prisma.tareaProductoEstado.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Change the state of an individual product within a task.
   * Triggers automatic stock management:
   * - Normal orders: deduct product stock when moving to EN_LOGISTICA
   * - Projection orders: add product stock when moving to ENTREGADO
   */
  async cambiarEstadoProducto(
    tareaId: string,
    dto: CambiarEstadoProductoDto,
    userId?: string,
  ) {
    // Verify tarea exists and get pedido info
    const tarea = await this.findOne(tareaId);

    const productoEstado = await this.prisma.tareaProductoEstado.findUnique({
      where: {
        tareaId_productoNombre: {
          tareaId,
          productoNombre: dto.productoNombre,
        },
      },
    });

    if (!productoEstado) {
      throw new NotFoundException(
        `Producto "${dto.productoNombre}" no encontrado en esta tarea`,
      );
    }

    const estadoAnterior = productoEstado.estado;

    const updated = await this.prisma.tareaProductoEstado.update({
      where: { id: productoEstado.id },
      data: { estado: dto.nuevoEstado },
    });

    const esProyeccion = tarea.pedido?.esProyeccion || false;

    // EN_LOGISTICA: deduct raw materials (production step) — applies to all orders
    if (
      dto.nuevoEstado === EstadoProductoEnTarea.EN_LOGISTICA &&
      estadoAnterior !== EstadoProductoEnTarea.EN_LOGISTICA &&
      estadoAnterior !== EstadoProductoEnTarea.ENTREGADO
    ) {
      try {
        await this.inventarioService.deducirMateriaPrimaPorProducto(
          dto.productoNombre,
          productoEstado.cantidad,
          tareaId,
          userId || 'system',
        );
      } catch (error) {
        console.warn(
          `⚠️ Raw material deduction failed for ${dto.productoNombre}: ${error.message}`,
        );
      }
    }

    // ENTREGADO: handle product stock
    if (
      dto.nuevoEstado === EstadoProductoEnTarea.ENTREGADO &&
      estadoAnterior !== EstadoProductoEnTarea.ENTREGADO
    ) {
      try {
        if (esProyeccion) {
          // Projection orders: ADD product stock
          await this.inventarioService.sumarProductoAlInventario(
            dto.productoNombre,
            productoEstado.cantidad,
            tareaId,
            userId || 'system',
          );
        } else {
          // Normal orders: DEDUCT product stock
          await this.inventarioService.deducirProductoDelInventario(
            dto.productoNombre,
            productoEstado.cantidad,
            tareaId,
            userId || 'system',
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ Product stock update failed for ${dto.productoNombre}: ${error.message}`,
        );
      }
    }

    return updated;
  }

  /**
   * Get all product states for a task.
   */
  async getProductosEstado(tareaId: string) {
    await this.findOne(tareaId); // Verify tarea exists

    return this.prisma.tareaProductoEstado.findMany({
      where: { tareaId },
      orderBy: { productoNombre: 'asc' },
    });
  }

  /**
   * Bulk change state of all products in a task.
   */
  async cambiarEstadoTodosProductos(
    tareaId: string,
    nuevoEstado: EstadoProductoEnTarea,
  ) {
    await this.findOne(tareaId); // Verify tarea exists

    await this.prisma.tareaProductoEstado.updateMany({
      where: { tareaId },
      data: { estado: nuevoEstado },
    });

    return this.getProductosEstado(tareaId);
  }
}
