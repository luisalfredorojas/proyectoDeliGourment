import apiClient from './api';
import { Pedido, CreatePedidoData, UpdatePedidoData } from '../types/entities';

export const pedidosService = {
  async getPedidos(filters?: {
    sucursalId?: string;
    rutaId?: string;
    fecha?: string;
  }): Promise<Pedido[]> {
    const params = new URLSearchParams();
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.rutaId) params.append('rutaId', filters.rutaId);
    if (filters?.fecha) params.append('fecha', filters.fecha);

    const response = await apiClient.get<Pedido[]>(`/pedidos?${params.toString()}`);
    return response.data;
  },

  async getPedido(id: string): Promise<Pedido> {
    const response = await apiClient.get<Pedido>(`/pedidos/${id}`);
    return response.data;
  },

  async createPedido(data: CreatePedidoData): Promise<Pedido> {
    const response = await apiClient.post<Pedido>('/pedidos', data);
    return response.data;
  },

  async updatePedido(id: string, data: UpdatePedidoData): Promise<Pedido> {
    const response = await apiClient.patch<Pedido>(`/pedidos/${id}`, data);
    return response.data;
  },

  async deletePedido(id: string): Promise<Pedido> {
    const response = await apiClient.delete<Pedido>(`/pedidos/${id}`);
    return response.data;
  },
};
