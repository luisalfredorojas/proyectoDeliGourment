import apiClient from './api';

export interface ProyeccionDetalle {
  producto: string;
  cantidad: number;
  precioUnitario?: number;
}

export interface Proyeccion {
  id: string;
  fechaProduccion: string;
  detalles: ProyeccionDetalle[];
  origen: 'MANUAL' | 'AUTOMATICA';
  estado: 'BORRADOR' | 'PENDIENTE' | 'EN_PRODUCCION' | 'CUADRADA' | 'CANCELADA';
  observaciones?: string;
  creadoPorId: string;
  createdAt: string;
  updatedAt: string;
  creadoPor?: { id: string; nombre: string };
  tarea?: { id: string; estado: string };
  _count?: { cuadres: number };
  cuadres?: any[];
}

export interface SugerenciaProduccion {
  fechaProduccion: string;
  detalles: ProyeccionDetalle[];
  semanasAnalizadas: number;
  totalPedidosAnalizados: number;
}

export interface ResumenCuadre {
  proyeccion: { id: string; fecha: string; estado: string };
  totalPedidosDelDia: number;
  comparacion: {
    producto: string;
    cantidadProyectada: number;
    cantidadReal: number;
    diferencia: number;
    porcentaje: number;
  }[];
  pedidosDisponibles: {
    id: string;
    sucursal: string;
    cliente: string;
    montoTotal: number;
    detalles: any;
  }[];
}

export const proyeccionesService = {
  async getProyecciones(filters?: { fecha?: string; estado?: string }): Promise<Proyeccion[]> {
    const params = new URLSearchParams();
    if (filters?.fecha) params.append('fecha', filters.fecha);
    if (filters?.estado) params.append('estado', filters.estado);
    const response = await apiClient.get<Proyeccion[]>(`/proyecciones?${params.toString()}`);
    return response.data;
  },

  async getProyeccion(id: string): Promise<Proyeccion> {
    const response = await apiClient.get<Proyeccion>(`/proyecciones/${id}`);
    return response.data;
  },

  async crear(data: { fechaProduccion: string; detalles: ProyeccionDetalle[]; observaciones?: string }): Promise<Proyeccion> {
    const response = await apiClient.post<Proyeccion>('/proyecciones', data);
    return response.data;
  },

  async actualizar(id: string, data: { detalles?: ProyeccionDetalle[]; observaciones?: string }): Promise<Proyeccion> {
    const response = await apiClient.patch<Proyeccion>(`/proyecciones/${id}`, data);
    return response.data;
  },

  async cambiarEstado(id: string, nuevoEstado: string): Promise<Proyeccion> {
    const response = await apiClient.patch<Proyeccion>(`/proyecciones/${id}/estado`, { nuevoEstado });
    return response.data;
  },

  async confirmar(id: string): Promise<Proyeccion> {
    const response = await apiClient.post<Proyeccion>(`/proyecciones/${id}/confirmar`);
    return response.data;
  },

  async cuadrar(id: string, pedidoIds: string[], observaciones?: string): Promise<Proyeccion> {
    const response = await apiClient.post<Proyeccion>(`/proyecciones/${id}/cuadrar`, { pedidoIds, observaciones });
    return response.data;
  },

  async getResumenCuadre(id: string): Promise<ResumenCuadre> {
    const response = await apiClient.get<ResumenCuadre>(`/proyecciones/${id}/resumen-cuadre`);
    return response.data;
  },

  async getSugerencia(fecha: string): Promise<SugerenciaProduccion | null> {
    const response = await apiClient.get<SugerenciaProduccion>(`/proyecciones/sugerencia?fecha=${fecha}`);
    return response.data;
  },
};
