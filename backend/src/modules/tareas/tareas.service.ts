import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TareaEstado } from '@prisma/client';
import { CambiarEstadoDto, AsignarTareaDto, AddComentarioDto, TipoComentario } from './dto/tarea.dto';

@Injectable()
export class TareasService {
  constructor(private prisma: PrismaService) {}

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
}
