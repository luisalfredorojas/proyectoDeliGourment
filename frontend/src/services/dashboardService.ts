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
  ventasHoy: VentasHoy;
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
  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }

  async getTareasOperativas(): Promise<TareasOperativas> {
    const response = await api.get('/dashboard/tareas-operativas');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
