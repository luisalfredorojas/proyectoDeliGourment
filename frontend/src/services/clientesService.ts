import apiClient from './api';
import { Cliente, ClienteProducto, CreateClienteData, UpdateClienteData } from '../types/entities';

export const clientesService = {
  // Get all clientes
  async getClientes(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/clientes');
    return response.data;
  },

  // Get one cliente
  async getCliente(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  // Create cliente
  async createCliente(data: CreateClienteData): Promise<Cliente> {
    const response = await apiClient.post<Cliente>('/clientes', data);
    return response.data;
  },

  // Update cliente
  async updateCliente(id: string, data: UpdateClienteData): Promise<Cliente> {
    const response = await apiClient.patch<Cliente>(`/clientes/${id}`, data);
    return response.data;
  },

  // Delete cliente (soft delete)
  async deleteCliente(id: string): Promise<Cliente> {
    const response = await apiClient.delete<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  // --- Catálogo de precios por cliente ---
  async getClienteProductos(clienteId: string): Promise<ClienteProducto[]> {
    const response = await apiClient.get<ClienteProducto[]>(`/clientes/${clienteId}/productos`);
    return response.data;
  },

  async addClienteProducto(clienteId: string, productoId: string, precio: number): Promise<ClienteProducto> {
    const response = await apiClient.post<ClienteProducto>(`/clientes/${clienteId}/productos`, { productoId, precio });
    return response.data;
  },

  async updateClienteProducto(clienteId: string, productoId: string, precio: number): Promise<ClienteProducto> {
    const response = await apiClient.patch<ClienteProducto>(`/clientes/${clienteId}/productos/${productoId}`, { precio });
    return response.data;
  },

  async removeClienteProducto(clienteId: string, productoId: string): Promise<void> {
    await apiClient.delete(`/clientes/${clienteId}/productos/${productoId}`);
  },
};
