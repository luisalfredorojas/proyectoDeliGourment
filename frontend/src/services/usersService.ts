import api from './api';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'ASISTENTE' | 'PRODUCCION';
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  nombre?: string;
  rol?: 'ADMIN' | 'ASISTENTE' | 'PRODUCCION';
}

export const usersService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string): Promise<User> => {
    const response = await api.patch(`/users/${id}/toggle-active`);
    return response.data;
  },
};
