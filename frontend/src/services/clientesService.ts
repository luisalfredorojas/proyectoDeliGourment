import apiClient from './api';
import { Cliente, CreateClienteData, UpdateClienteData } from '../types/entities';

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
};
