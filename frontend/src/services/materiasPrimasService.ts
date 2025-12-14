import api from './api';

export interface MateriaPrima {
  id: string;
  nombre: string;
  cantidadDisponible: number;
  unidadMedida: string;
}

export const materiasPrimasService = {
  getMateriasPrimas: async () => {
    const response = await api.get<MateriaPrima[]>('/materias-primas');
    return response.data;
  },

  createMateriaPrima: async (data: Omit<MateriaPrima, 'id'>) => {
    const response = await api.post<MateriaPrima>('/materias-primas', data);
    return response.data;
  },

  updateMateriaPrima: async (id: string, data: Partial<MateriaPrima>) => {
    const response = await api.patch<MateriaPrima>(`/materias-primas/${id}`, data);
    return response.data;
  },

  deleteMateriaPrima: async (id: string) => {
    await api.delete(`/materias-primas/${id}`);
  },
};
