import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const hoy = startOfDay(new Date());
    const ayer = subDays(hoy, 1);

    // Ventas de hoy vs ayer
    const ventasHoy = await this.getVentasDia(hoy);
    const ventasAyer = await this.getVentasDia(ayer);
    
    const comparacionAyer = ventasAyer.total > 0 
      ? ((ventasHoy.total - ventasAyer.total) / ventasAyer.total) * 100 
      : 0;

    // Tareas por estado
    const tareasPorEstado = await this.getTareasPorEstado();

    // Productos a producir (items en tareas EN_PROCESO)
    const productosAProducir = await this.getProductosEnProceso();

    // Ventas últimos 7 días
    const ventasPorDia = await this.getVentasUltimos7Dias();

    // Top 5 productos más vendidos
    const topProductos = await this.getTopProductos(5);

    // Ventas por ruta
    const ventasPorRuta = await this.getVentasPorRuta();

    // Pedidos recientes
    const pedidosRecientes = await this.getPedidosRecientes(5);

    return {
      ventasHoy: {
        total: ventasHoy.total,
        comparacionAyer: Math.round(comparacionAyer * 10) / 10, // 1 decimal
        pedidosCount: ventasHoy.count,
      },
      tareasPorEstado,
      productosAProducir,
      ventasPorDia,
      topProductos,
      ventasPorRuta,
      pedidosRecientes,
    };
  }

  async getTareasOperativas() {
    const tareasPendientes = await this.prisma.tarea.findMany({
      where: { estado: 'ABIERTO' },
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
      orderBy: { fechaCreacion: 'asc' },
    });

    const tareasEnProceso = await this.prisma.tarea.findMany({
      where: { estado: 'EN_PROCESO' },
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
      orderBy: { fechaCreacion: 'asc' },
    });

    return {
      tareasPendientes,
      tareasEnProceso,
    };
  }

  // Helper methods
  private async getVentasDia(fecha: Date) {
    const siguienteDia = new Date(fecha);
    siguienteDia.setDate(siguienteDia.getDate() + 1);

    const pedidos = await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: {
          gte: fecha,
          lt: siguienteDia,
        },
      },
      select: {
        montoTotal: true,
      },
    });

    const total = pedidos.reduce((sum, p) => sum + Number(p.montoTotal), 0);
    return { total, count: pedidos.length };
  }

  private async getTareasPorEstado() {
    const tareas = await this.prisma.tarea.groupBy({
      by: ['estado'],
      _count: true,
    });

    const resultado = {
      ABIERTO: 0,
      EN_PROCESO: 0,
      EN_ESPERA: 0,
      EMBALAJE: 0,
      LOGISTICA: 0,
      ENTREGADO: 0,
      CANCELADO: 0,
    };

    tareas.forEach((t) => {
      resultado[t.estado] = t._count;
    });

    return resultado;
  }

  private async getProductosEnProceso() {
    const tareasEnProceso = await this.prisma.tarea.findMany({
      where: { estado: 'EN_PROCESO' },
      include: {
        pedido: {
          select: {
            detalles: true,
          },
        },
      },
    });

    let total = 0;
    tareasEnProceso.forEach((tarea) => {
      const detalles = tarea.pedido?.detalles as any[];
      if (detalles && Array.isArray(detalles)) {
        detalles.forEach((detalle) => {
          total += detalle.cantidad || 0;
        });
      }
    });

    return total;
  }

  private async getVentasUltimos7Dias() {
    const resultado = [];
    const hoy = startOfDay(new Date());

    for (let i = 6; i >= 0; i--) {
      const fecha = subDays(hoy, i);
      const ventasDia = await this.getVentasDia(fecha);
      resultado.push({
        fecha: format(fecha, 'dd/MM'),
        total: ventasDia.total,
      });
    }

    return resultado;
  }

  private async getTopProductos(limit: number) {
    const pedidos = await this.prisma.pedido.findMany({
      select: {
        detalles: true,
      },
    });

    // Agrupar productos y contar
    const productosMap = new Map<string, { cantidad: number; ventas: number }>();

    pedidos.forEach((pedido) => {
      const detalles = pedido.detalles as any[];
      if (detalles && Array.isArray(detalles)) {
        detalles.forEach((detalle) => {
          const nombre = detalle.producto || 'Sin nombre';
          const actual = productosMap.get(nombre) || { cantidad: 0, ventas: 0 };
          productosMap.set(nombre, {
            cantidad: actual.cantidad + (detalle.cantidad || 0),
            ventas: actual.ventas + (detalle.cantidad * detalle.precioUnitario || 0),
          });
        });
      }
    });

    // Convertir a array y ordenar
    const productos = Array.from(productosMap.entries())
      .map(([producto, data]) => ({
        producto,
        cantidad: data.cantidad,
        ventas: data.ventas,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);

    return productos;
  }

  private async getVentasPorRuta() {
    const pedidos = await this.prisma.pedido.findMany({
      include: {
        sucursal: {
          include: {
            ruta: true,
          },
        },
      },
    });

    // Agrupar por ruta
    const rutasMap = new Map<string, number>();

    pedidos.forEach((pedido) => {
      const nombreRuta = pedido.sucursal?.ruta?.nombre || 'Sin ruta';
      const actual = rutasMap.get(nombreRuta) || 0;
      rutasMap.set(nombreRuta, actual + Number(pedido.montoTotal));
    });

    return Array.from(rutasMap.entries())
      .map(([ruta, total]) => ({ ruta, total }))
      .sort((a, b) => b.total - a.total);
  }

  private async getPedidosRecientes(limit: number) {
    return await this.prisma.pedido.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sucursal: {
          include: {
            cliente: true,
            ruta: true,
          },
        },
        tarea: {
          select: {
            estado: true,
          },
        },
      },
    });
  }
}
