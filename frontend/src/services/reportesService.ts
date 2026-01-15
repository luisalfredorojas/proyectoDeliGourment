import api from './api';

// Types
export interface SalesReportData {
  totalVentas: number;
  totalPedidos: number;
  promedioVenta: number;
  ventasDiarias: Array<{ fecha: string; total: number }>;
  topClientes: Array<{ nombre: string; total: number; pedidos: number }>;
  topProductos: Array<{ nombre: string; cantidad: number; ingresos: number }>;
  periodo: { inicio: string; fin: string };
}

export interface DeliveryReportData {
  totalEntregas: number;
  rutas: Array<{ nombre: string; entregas: number }>;
  estados: Array<{ estado: string; cantidad: number }>;
  periodo: { inicio: string; fin: string };
}

export interface ConsignmentReportData {
  totalConsignaciones: number;
  totalPedidosConConsignacion: number;
  productos: Array<{ nombre: string; cantidad: number }>;
  periodo: { inicio: string; fin: string };
}

export interface OperationalReportData {
  totalTareas: number;
  tareasCanceladas: number;
  porcentajeCancelacion: number;
  estados: Array<{ estado: string; cantidad: number }>;
  motivosCancelacion: Array<{ motivo: string; cantidad: number }>;
  periodo: { inicio: string; fin: string };
}

class ReportesService {
  // Production
  async getProductionReport(filters: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.rutaId) params.append('rutaId', filters.rutaId);
    if (filters.producto) params.append('producto', filters.producto);

    const response = await api.get(`/reportes/produccion?${params.toString()}`);
    return response.data;
  }

  // Sales
  async getSalesReport(filters: any): Promise<SalesReportData> {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.clienteId) params.append('clienteId', filters.clienteId);
    if (filters.rutaId) params.append('rutaId', filters.rutaId);

    const response = await api.get(`/reportes/ventas?${params.toString()}`);
    return response.data;
  }

  // Delivery
  async getDeliveryReport(filters: any): Promise<DeliveryReportData> {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.rutaId) params.append('rutaId', filters.rutaId);

    const response = await api.get(`/reportes/entregas?${params.toString()}`);
    return response.data;
  }

  // Consignment
  async getConsignmentReport(filters: any): Promise<ConsignmentReportData> {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

    const response = await api.get(`/reportes/consignaciones?${params.toString()}`);
    return response.data;
  }

  // Operational
  async getOperationalReport(filters: any): Promise<OperationalReportData> {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

    const response = await api.get(`/reportes/operativos?${params.toString()}`);
    return response.data;
  }
}

export const reportesService = new ReportesService();
