import apiClient from './api';
import { Ruta, CreateRutaData, UpdateRutaData } from '../types/entities';

export const rutasService = {
  // Get all rutas
  async getRutas(): Promise<Ruta[]> {
    const response = await apiClient.get<Ruta[]>('/rutas');
    return response.data;
  },

  // Get one ruta
  async getRuta(id: string): Promise<Ruta> {
    const response = await apiClient.get<Ruta>(`/rutas/${id}`);
    return response.data;
  },

  // Create ruta
  async createRuta(data: CreateRutaData): Promise<Ruta> {
    const response = await apiClient.post<Ruta>('/rutas', data);
    return response.data;
  },

  // Update ruta
  async updateRuta(id: string, data: UpdateRutaData): Promise<Ruta> {
    const response = await apiClient.patch<Ruta>(`/rutas/${id}`, data);
    return response.data;
  },

  // Delete ruta (soft delete)
  async deleteRuta(id: string): Promise<Ruta> {
    const response = await apiClient.delete<Ruta>(`/rutas/${id}`);
    return response.data;
  },
};
