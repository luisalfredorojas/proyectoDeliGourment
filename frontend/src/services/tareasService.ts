import apiClient from './api';
import {
  Tarea,
  TareaEstado,
  CambiarEstadoData,
  AsignarTareaData,
  AddComentarioData,
  ComentarioTarea,
  TimelineEvent,
} from '../types/entities';

export const tareasService = {
  async getTareas(filters?: {
    estado?: TareaEstado;
    asignadoId?: string;
    rutaId?: string;
    fecha?: string;
  }): Promise<Tarea[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.asignadoId) params.append('asignadoId', filters.asignadoId);
    if (filters?.rutaId) params.append('rutaId', filters.rutaId);
    if (filters?.fecha) params.append('fecha', filters.fecha);

    const response = await apiClient.get<Tarea[]>(`/tareas?${params.toString()}`);
    return response.data;
  },

  async getTarea(id: string): Promise<Tarea> {
    const response = await apiClient.get<Tarea>(`/tareas/${id}`);
    return response.data;
  },

  async cambiarEstado(id: string, data: CambiarEstadoData): Promise<Tarea> {
    const response = await apiClient.patch<Tarea>(`/tareas/${id}/estado`, data);
    return response.data;
  },

  async asignarTarea(id: string, data: AsignarTareaData): Promise<Tarea> {
    const response = await apiClient.patch<Tarea>(`/tareas/${id}/asignar`, data);
    return response.data;
  },

  async addComentario(id: string, data: AddComentarioData): Promise<ComentarioTarea> {
    const response = await apiClient.post<ComentarioTarea>(`/tareas/${id}/comentarios`, data);
    return response.data;
  },

  async getHistorial(id: string): Promise<TimelineEvent[]> {
    const response = await apiClient.get<TimelineEvent[]>(`/tareas/${id}/historial`);
    return response.data;
  },
};
