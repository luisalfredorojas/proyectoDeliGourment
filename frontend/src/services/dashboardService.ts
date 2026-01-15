import api from './api';

export interface VentasHoy {
  total: number;
  comparacionAyer: number;
  pedidosCount: number;
}

export interface TareasPorEstado {
  ABIERTO: number;
  EN_PROCESO: number;
  EN_ESPERA: number;
  EMBALAJE: number;
  LOGISTICA: number;
  ENTREGADO: number;
  CANCELADO: number;
}

export interface VentaDia {
  fecha: string;
  total: number;
}

export interface TopProducto {
  producto: string;
  cantidad: number;
  ventas: number;
}

export interface VentaRuta {
  ruta: string;
  total: number;
}

export interface AdminStats {
  ventasRango: VentasHoy;
  periodo: {
    inicio: string;
    fin: string;
  };
  tareasPorEstado: TareasPorEstado;
  productosAProducir: number;
  ventasPorDia: VentaDia[];
  topProductos: TopProducto[];
  ventasPorRuta: VentaRuta[];
  pedidosRecientes: any[];
}

export interface TareasOperativas {
  tareasPendientes: any[];
  tareasEnProceso: any[];
}

class DashboardService {
  async getAdminStats(fechaInicio?: string, fechaFin?: string): Promise<AdminStats> {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get(`/dashboard/stats?${params.toString()}`);
    return response.data;
  }

  async getTareasOperativas(): Promise<TareasOperativas> {
    const response = await api.get('/dashboard/tareas-operativas');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
