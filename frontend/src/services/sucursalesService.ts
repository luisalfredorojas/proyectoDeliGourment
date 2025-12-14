import apiClient from './api';
import { Sucursal, CreateSucursalData, UpdateSucursalData } from '../types/entities';

export const sucursalesService = {
  // Get all sucursales
  async getSucursales(clienteId?: string, rutaId?: string): Promise<Sucursal[]> {
    const params = new URLSearchParams();
    if (clienteId) params.append('clienteId', clienteId);
    if (rutaId) params.append('rutaId', rutaId);
    
    const response = await apiClient.get<Sucursal[]>(`/sucursales?${params.toString()}`);
    return response.data;
  },

  // Get one sucursal
  async getSucursal(id: string): Promise<Sucursal> {
    const response = await apiClient.get<Sucursal>(`/sucursales/${id}`);
    return response.data;
  },

  // Create sucursal
  async createSucursal(data: CreateSucursalData): Promise<Sucursal> {
    const response = await apiClient.post<Sucursal>('/sucursales', data);
    return response.data;
  },

  // Update sucursal
  async updateSucursal(id: string, data: UpdateSucursalData): Promise<Sucursal> {
    const response = await apiClient.patch<Sucursal>(`/sucursales/${id}`, data);
    return response.data;
  },

  // Delete sucursal (soft delete)
  async deleteSucursal(id: string): Promise<Sucursal> {
    const response = await apiClient.delete<Sucursal>(`/sucursales/${id}`);
    return response.data;
  },
};
