import apiClient from './api';

export interface MateriaPrimaInventario {
  id: string;
  nombre: string;
  cantidadDisponible: number;
  unidadMedida: string;
  stockMinimo: number;
  costoUnitario?: number;
  proveedor?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    movimientos: number;
    productos: number;
  };
}

export interface MovimientoInventario {
  id: string;
  materiaPrimaId?: string;
  productoId?: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  motivo: 'COMPRA' | 'PRODUCCION' | 'MERMA' | 'AJUSTE_MANUAL' | 'DEVOLUCION';
  cantidad: number;
  stockResultante: number;
  referencia?: string;
  observaciones?: string;
  fecha: string;
  materiaPrima?: { id?: string; nombre: string; unidadMedida: string };
  producto?: { id?: string; nombre: string };
  usuario?: { id: string; nombre: string };
}

export interface RegistrarMovimientoData {
  materiaPrimaId?: string;
  productoId?: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  motivo: 'COMPRA' | 'PRODUCCION' | 'MERMA' | 'AJUSTE_MANUAL' | 'DEVOLUCION';
  cantidad: number;
  referencia?: string;
  observaciones?: string;
}

export interface AlertaStockBajo extends MateriaPrimaInventario {
  deficit: number;
  porcentajeStock: number;
}

export interface ResumenInventario {
  totalMateriasPrimas: number;
  alertasStockBajo: number;
  totalMovimientos: number;
  totalProductos?: number;
  alertas: AlertaStockBajo[];
}

export interface StockProducto {
  id: string;
  nombre: string;
  precio: number;
  stockDisponible: number;
  mermaTotal?: number;
  _count?: { movimientosInventario: number };
}

export const inventarioService = {
  // Materias Primas
  async getMateriasPrimas(): Promise<MateriaPrimaInventario[]> {
    const response = await apiClient.get<MateriaPrimaInventario[]>('/inventario/materias-primas');
    return response.data;
  },

  async getMateriaPrima(id: string): Promise<any> {
    const response = await apiClient.get(`/inventario/materias-primas/${id}`);
    return response.data;
  },

  async updateMateriaPrima(id: string, data: Partial<MateriaPrimaInventario>): Promise<MateriaPrimaInventario> {
    const response = await apiClient.patch<MateriaPrimaInventario>(`/inventario/materias-primas/${id}`, data);
    return response.data;
  },

  // Movimientos
  async registrarMovimiento(data: RegistrarMovimientoData): Promise<MovimientoInventario> {
    const response = await apiClient.post<MovimientoInventario>('/inventario/movimientos', data);
    return response.data;
  },

  async getAllMovimientos(limit?: number, skip?: number): Promise<MovimientoInventario[]> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (skip) params.set('skip', String(skip));
    const qs = params.toString();
    const response = await apiClient.get<MovimientoInventario[]>(`/inventario/movimientos${qs ? '?' + qs : ''}`);
    return response.data;
  },

  async getMovimientos(materiaPrimaId: string, limit?: number): Promise<MovimientoInventario[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<MovimientoInventario[]>(`/inventario/movimientos/${materiaPrimaId}${params}`);
    return response.data;
  },

  // Alertas y Resumen
  async getAlertas(): Promise<AlertaStockBajo[]> {
    const response = await apiClient.get<AlertaStockBajo[]>('/inventario/alertas');
    return response.data;
  },

  async getResumen(): Promise<ResumenInventario> {
    const response = await apiClient.get<ResumenInventario>('/inventario/resumen');
    return response.data;
  },

  // Stock de Productos
  async getStockProductos(): Promise<StockProducto[]> {
    const response = await apiClient.get<StockProducto[]>('/inventario/stock-productos');
    return response.data;
  },
};
