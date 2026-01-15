import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats(fechaInicio?: string, fechaFin?: string) {
    // Si no se proporcionan fechas, usar el día actual
    const inicio = fechaInicio ? new Date(fechaInicio) : startOfDay(new Date());
    const fin = fechaFin ? endOfDay(new Date(fechaFin)) : endOfDay(new Date());

    // Ventas del rango seleccionado
    const ventasRango = await this.getVentasRango(inicio, fin);
    
    // Calcular comparación con período anterior (mismo número de días)
    const diasDiferencia = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const inicioAnterior = subDays(inicio, diasDiferencia);
    const finAnterior = subDays(fin, diasDiferencia);
    const ventasAnterior = await this.getVentasRango(inicioAnterior, finAnterior);
    
    const comparacionAnterior = ventasAnterior.total > 0 
      ? ((ventasRango.total - ventasAnterior.total) / ventasAnterior.total) * 100 
      : 0;

    // Tareas por estado (filtradas por fecha)
    const tareasPorEstado = await this.getTareasPorEstado(inicio, fin);

    // Productos a producir (items en tareas EN_PROCESO filtradas por fecha)
    const productosAProducir = await this.getProductosEnProceso(inicio, fin);

    // Ventas por día en el rango
    const ventasPorDia = await this.getVentasPorDiaRango(inicio, fin);

    // Top 5 productos más vendidos en el rango
    const topProductos = await this.getTopProductos(5, inicio, fin);

    // Ventas por ruta en el rango
    const ventasPorRuta = await this.getVentasPorRuta(inicio, fin);

    // Pedidos recientes en el rango
    const pedidosRecientes = await this.getPedidosRecientes(5, inicio, fin);

    return {
      ventasRango: {
        total: ventasRango.total,
        comparacionAnterior: Math.round(comparacionAnterior * 10) / 10,
        pedidosCount: ventasRango.count,
      },
      periodo: {
        inicio: format(inicio, 'yyyy-MM-dd'),
        fin: format(fin, 'yyyy-MM-dd'),
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
  private async getVentasRango(inicio: Date, fin: Date) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: {
          gte: inicio,
          lte: fin,
        },
      },
      select: {
        montoTotal: true,
      },
    });

    const total = pedidos.reduce((sum, p) => sum + Number(p.montoTotal), 0);
    return { total, count: pedidos.length };
  }

  private async getTareasPorEstado(inicio: Date, fin: Date) {
    const tareas = await this.prisma.tarea.findMany({
      where: {
        pedido: {
          fechaProduccion: {
            gte: inicio,
            lte: fin,
          },
        },
      },
      select: {
        estado: true,
      },
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
      resultado[t.estado] = (resultado[t.estado] || 0) + 1;
    });

    return resultado;
  }

  private async getProductosEnProceso(inicio: Date, fin: Date) {
    const tareasEnProceso = await this.prisma.tarea.findMany({
      where: {
        estado: 'EN_PROCESO',
        pedido: {
          fechaProduccion: {
            gte: inicio,
            lte: fin,
          },
        },
      },
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

  private async getVentasPorDiaRango(inicio: Date, fin: Date) {
    const resultado = [];
    const diasDiferencia = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    
    // Limitar a máximo 30 días para no sobrecargar
    const diasAMostrar = Math.min(diasDiferencia + 1, 30);

    for (let i = 0; i < diasAMostrar; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(fecha.getDate() + i);
      
      const siguienteDia = new Date(fecha);
      siguienteDia.setDate(siguienteDia.getDate() + 1);

      const pedidos = await this.prisma.pedido.findMany({
        where: {
          fechaProduccion: {
            gte: startOfDay(fecha),
            lt: startOfDay(siguienteDia),
          },
        },
        select: {
          montoTotal: true,
        },
      });

      const total = pedidos.reduce((sum, p) => sum + Number(p.montoTotal), 0);
      
      resultado.push({
        fecha: format(fecha, 'dd/MM'),
        total,
      });
    }

    return resultado;
  }

  private async getTopProductos(limit: number, inicio: Date, fin: Date) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: {
          gte: inicio,
          lte: fin,
        },
      },
      select: {
        detalles: true,
      },
    });

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

  private async getVentasPorRuta(inicio: Date, fin: Date) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        sucursal: {
          include: {
            ruta: true,
          },
        },
      },
    });

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

  private async getPedidosRecientes(limit: number, inicio: Date, fin: Date) {
    return await this.prisma.pedido.findMany({
      where: {
        fechaProduccion: {
          gte: inicio,
          lte: fin,
        },
      },
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
