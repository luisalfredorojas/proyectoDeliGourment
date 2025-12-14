import api from './api';
import { MateriaPrima } from './materiasPrimasService';

export interface MateriaPrimaRequerida {
  materiaPrimaId: string;
  cantidadRequerida: number;
  materiaPrima?: MateriaPrima;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  materiasPrimas?: MateriaPrimaRequerida[];
}

export const productosService = {
  getProductos: async () => {
    const response = await api.get<Producto[]>('/productos');
    return response.data;
  },

  createProducto: async (data: Omit<Producto, 'id'>) => {
    const response = await api.post<Producto>('/productos', data);
    return response.data;
  },

  updateProducto: async (id: string, data: Partial<Producto>) => {
    const response = await api.patch<Producto>(`/productos/${id}`, data);
    return response.data;
  },

  deleteProducto: async (id: string) => {
    await api.delete(`/productos/${id}`);
  },
};
