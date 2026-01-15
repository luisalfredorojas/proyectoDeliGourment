import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductionReportDto } from './dto/production-report.dto';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // ==================== PRODUCTION REPORTS ====================
  
  async getProductionReport(filters: ProductionReportDto) {
    const { fechaInicio, fechaFin, rutaId, producto } = filters;

    const where: any = {
      estado: 'EN_PROCESO',
    };

    if (fechaInicio || fechaFin) {
      where.pedido = {
        fechaProduccion: {},
      };
      if (fechaInicio) {
        where.pedido.fechaProduccion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.pedido.fechaProduccion.lte = new Date(fechaFin);
      }
    }

    if (rutaId) {
      where.pedido = {
        ...where.pedido,
        sucursal: {
          rutaId,
        },
      };
    }

    const tareas = await this.prisma.tarea.findMany({
      where,
      include: {
        pedido: {
          include: {
            sucursal: {
              include: {
                ruta: true,
                cliente: true,
              },
            },
          },
        },
      },
    });

    const productMap = new Map<string, number>();
    const rutaMap = new Map<string, number>();

    tareas.forEach((tarea) => {
      const detalles = tarea.pedido?.detalles as any[];
      if (detalles && Array.isArray(detalles)) {
        detalles.forEach((detalle) => {
          if (!producto || detalle.producto === producto) {
            const currentQty = productMap.get(detalle.producto) || 0;
            productMap.set(detalle.producto, currentQty + detalle.cantidad);
          }
        });
      }

      const rutaNombre = tarea.pedido?.sucursal?.ruta?.nombre || 'Sin ruta';
      const currentCount = rutaMap.get(rutaNombre) || 0;
      rutaMap.set(rutaNombre, currentCount + 1);
    });

    const productos = Array.from(productMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const rutas = Array.from(rutaMap.entries())
      .map(([nombre, tareas]) => ({ nombre, tareas }))
      .sort((a, b) => b.tareas - a.tareas);

    return {
      totalTareas: tareas.length,
      productos,
      rutas,
      periodo: {
        inicio: fechaInicio || 'N/A',
        fin: fechaFin || 'N/A',
      },
    };
  }

  async getDailyProductionReport(fecha: string) {
    return this.getProductionReport({
      fechaInicio: fecha,
      fechaFin: fecha,
    });
  }

  async getWeeklyProductionReport(fechaInicio: string, fechaFin: string) {
    return this.getProductionReport({
      fechaInicio,
      fechaFin,
    });
  }

  // ==================== SALES REPORTS ====================

  async getSalesReport(filters: any) {
    const { fechaInicio, fechaFin, clienteId, rutaId } = filters;

    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.fechaProduccion = {};
      if (fechaInicio) {
        where.fechaProduccion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fechaProduccion.lte = new Date(fechaFin);
      }
    }

    if (clienteId) {
      where.sucursal = {
        clienteId,
      };
    }

    if (rutaId) {
      where.sucursal = {
        ...where.sucursal,
        rutaId,
      };
    }

    const pedidos = await this.prisma.pedido.findMany({
      where,
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

    let totalVentas = 0;
    const ventasPorDia = new Map<string, number>();
    const ventasPorCliente = new Map<string, { nombre: string; total: number; pedidos: number }>();
    const ventasPorProducto = new Map<string, { cantidad: number; ingresos: number }>();

    pedidos.forEach((pedido) => {
      const monto = Number(pedido.montoTotal);
      totalVentas += monto;

      const fecha = pedido.fechaProduccion.toISOString().split('T')[0];
      const currentDayTotal = ventasPorDia.get(fecha) || 0;
      ventasPorDia.set(fecha, currentDayTotal + monto);

      const clienteNombre = pedido.sucursal?.cliente?.razonSocial || 'Sin cliente';
      const clienteData = ventasPorCliente.get(clienteNombre) || { nombre: clienteNombre, total: 0, pedidos: 0 };
      clienteData.total += monto;
      clienteData.pedidos += 1;
      ventasPorCliente.set(clienteNombre, clienteData);

      const detalles = pedido.detalles as any[];
      if (detalles && Array.isArray(detalles)) {
        detalles.forEach((detalle) => {
          const productoData = ventasPorProducto.get(detalle.producto) || { cantidad: 0, ingresos: 0 };
          productoData.cantidad += detalle.cantidad || 0;
          productoData.ingresos += (detalle.cantidad || 0) * (detalle.precioUnitario || 0);
          ventasPorProducto.set(detalle.producto, productoData);
        });
      }
    });

    const ventasDiarias = Array.from(ventasPorDia.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const topClientes = Array.from(ventasPorCliente.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const topProductos = Array.from(ventasPorProducto.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10);

    return {
      totalVentas,
      totalPedidos: pedidos.length,
      promedioVenta: pedidos.length > 0 ? totalVentas / pedidos.length : 0,
      ventasDiarias,
      topClientes,
      topProductos,
      periodo: {
        inicio: fechaInicio || 'N/A',
        fin: fechaFin || 'N/A',
      },
    };
  }

  // ==================== DELIVERY REPORTS ====================

  async getDeliveryReport(filters: any) {
    const { fechaInicio, fechaFin, rutaId } = filters;

    const where: any = {
      estado: { in: ['LOGISTICA', 'ENTREGADO'] },
    };

    if (fechaInicio || fechaFin) {
      where.pedido = {
        fechaProduccion: {},
      };
      if (fechaInicio) {
        where.pedido.fechaProduccion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.pedido.fechaProduccion.lte = new Date(fechaFin);
      }
    }

    if (rutaId) {
      where.pedido = {
        ...where.pedido,
        sucursal: {
          rutaId,
        },
      };
    }

    const tareas = await this.prisma.tarea.findMany({
      where,
      include: {
        pedido: {
          include: {
            sucursal: {
              include: {
                ruta: true,
                cliente: true,
              },
            },
          },
        },
      },
    });

    const entregasPorRuta = new Map<string, number>();
    const entregasPorEstado = new Map<string, number>();
    let totalEntregas = 0;

    tareas.forEach((tarea) => {
      totalEntregas++;

      const rutaNombre = tarea.pedido?.sucursal?.ruta?.nombre || 'Sin ruta';
      const currentCount = entregasPorRuta.get(rutaNombre) || 0;
      entregasPorRuta.set(rutaNombre, currentCount + 1);

      const currentEstadoCount = entregasPorEstado.get(tarea.estado) || 0;
      entregasPorEstado.set(tarea.estado, currentEstadoCount + 1);
    });

    const rutas = Array.from(entregasPorRuta.entries())
      .map(([nombre, entregas]) => ({ nombre, entregas }))
      .sort((a, b) => b.entregas - a.entregas);

    const estados = Array.from(entregasPorEstado.entries())
      .map(([estado, cantidad]) => ({ estado, cantidad }));

    return {
      totalEntregas,
      rutas,
      estados,
      periodo: {
        inicio: fechaInicio || 'N/A',
        fin: fechaFin || 'N/A',
      },
    };
  }

  // ==================== CONSIGNMENT REPORTS ====================

  async getConsignmentReport(filters: any) {
    const { fechaInicio, fechaFin } = filters;

    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.fechaProduccion = {};
      if (fechaInicio) {
        where.fechaProduccion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fechaProduccion.lte = new Date(fechaFin);
      }
    }

    const pedidos = await this.prisma.pedido.findMany({
      where,
      include: {
        sucursal: {
          include: {
            cliente: true,
          },
        },
      },
    });

    const consignacionesPorProducto = new Map<string, number>();
    let totalConsignaciones = 0;

    pedidos.forEach((pedido) => {
      const consignaciones = pedido.consignaciones as any;
      if (consignaciones && Array.isArray(consignaciones)) {
        consignaciones.forEach((consig: any) => {
          const cantidad = consig.cantidad || 0;
          totalConsignaciones += cantidad;

          const currentQty = consignacionesPorProducto.get(consig.producto) || 0;
          consignacionesPorProducto.set(consig.producto, currentQty + cantidad);
        });
      }
    });

    const productos = Array.from(consignacionesPorProducto.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      totalConsignaciones,
      totalPedidosConConsignacion: pedidos.filter(p => p.consignaciones && Array.isArray(p.consignaciones) && p.consignaciones.length > 0).length,
      productos,
      periodo: {
        inicio: fechaInicio || 'N/A',
        fin: fechaFin || 'N/A',
      },
    };
  }

  // ==================== OPERATIONAL REPORTS ====================

  async getOperationalReport(filters: any) {
    const { fechaInicio, fechaFin } = filters;

    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.pedido = {
        fechaProduccion: {},
      };
      if (fechaInicio) {
        where.pedido.fechaProduccion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.pedido.fechaProduccion.lte = new Date(fechaFin);
      }
    }

    const tareas = await this.prisma.tarea.findMany({
      where,
      include: {
        pedido: true,
      },
    });

    const tareasPorEstado = new Map<string, number>();
    let tareasCanceladas = 0;

    tareas.forEach((tarea) => {
      const currentCount = tareasPorEstado.get(tarea.estado) || 0;
      tareasPorEstado.set(tarea.estado, currentCount + 1);

      if (tarea.estado === 'CANCELADO') {
        tareasCanceladas++;
      }
    });

    const estados = Array.from(tareasPorEstado.entries())
      .map(([estado, cantidad]) => ({ estado, cantidad }));

    return {
      totalTareas: tareas.length,
      tareasCanceladas,
      porcentajeCancelacion: tareas.length > 0 ? (tareasCanceladas / tareas.length) * 100 : 0,
      estados,
      motivosCancelacion: [],
      periodo: {
        inicio: fechaInicio || 'N/A',
        fin: fechaFin || 'N/A',
      },
    };
  }
}
