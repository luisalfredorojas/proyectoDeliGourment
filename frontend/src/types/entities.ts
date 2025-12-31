// Ruta
export interface Ruta {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sucursales: number;
  };
}

export interface CreateRutaData {
  nombre: string;
  descripcion?: string;
}

export interface UpdateRutaData {
  nombre?: string;
  descripcion?: string;
  activa?: boolean;
}

// Cliente
export interface Cliente {
  id: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  ubicacion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sucursales: number;
  };
}

export interface CreateClienteData {
  razonSocial: string;
  ruc: string;
  direccion: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  ubicacion?: string;
}

export interface UpdateClienteData {
  razonSocial?: string;
  ruc?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  ubicacion?: string;
  activo?: boolean;
}

// Sucursal
export interface Sucursal {
  id: string;
  clienteId: string;
  rutaId: string;
  nombre: string;
  direccion?: string;
  ubicacion?: string;
  telefono?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: string;
    razonSocial: string;
  };
  ruta?: {
    id: string;
    nombre: string;
  };
}

export interface CreateSucursalData {
  clienteId: string;
  rutaId: string;
  nombre: string;
  direccion?: string;
  ubicacion?: string;
  telefono?: string;
}

export interface UpdateSucursalData {
  clienteId?: string;
  rutaId?: string;
  nombre?: string;
  direccion?: string;
  ubicacion?: string;
  telefono?: string;
  activa?: boolean;
}

// Pedido
export interface DetalleProducto {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  productoId?: string;
}

export interface Pedido {
  id: string;
  sucursalId: string;
  fechaRecepcion: string;
  fechaProduccion: string;
  detalles: DetalleProducto[];
  consignaciones?: { producto: string; cantidad: number }[];
  montoTotal: number;
  observaciones?: string;
  fueraDeHorario: boolean;
  creadoPorId: string;
  createdAt: string;
  updatedAt: string;
  sucursal?: {
    id: string;
    nombre: string;
    cliente?: {
      id: string;
      razonSocial: string;
    };
    ruta?: {
      id: string;
      nombre: string;
    };
  };
  creadoPor?: {
    id: string;
    nombre: string;
    email: string;
  };
  tarea?: {
    id: string;
    estado: TareaEstado;
  };
}

export interface CreatePedidoData {
  sucursalId: string;
  detalles: DetalleProducto[];
  consignaciones?: { producto: string; cantidad: number }[];
  observaciones?: string;
}

export interface UpdatePedidoData {
  sucursalId?: string;
  detalles?: DetalleProducto[];
  observaciones?: string;
  fechaProduccion?: string;
}

// Tarea
export enum TareaEstado {
  ABIERTO = 'ABIERTO',
  EN_PROCESO = 'EN_PROCESO',
  EN_ESPERA = 'EN_ESPERA',
  EMBALAJE = 'EMBALAJE',
  LOGISTICA = 'LOGISTICA',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export enum TipoComentario {
  GENERAL = 'GENERAL',
  ESPERA = 'ESPERA',
  PROBLEMA = 'PROBLEMA',
}

export interface Tarea {
  id: string;
  pedidoId: string;
  estado: TareaEstado;
  asignadoAId?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  pedido?: Pedido;
  asignadoA?: {
    id: string;
    nombre: string;
    email: string;
  };
  comentarios?: ComentarioTarea[];
  historialEstados?: HistorialEstado[];
  _count?: {
    comentarios: number;
  };
}

export interface ComentarioTarea {
  id: string;
  tareaId: string;
  usuarioId: string;
  comentario: string;
  tipo: TipoComentario;
  fecha: string;
  usuario?: {
    id: string;
    nombre: string;
  };
}

export interface HistorialEstado {
  id: string;
  tareaId: string;
  estadoAnterior?: TareaEstado;
  estadoNuevo: TareaEstado;
  usuarioId: string;
  comentario?: string;
  fecha: string;
  usuario?: {
    id: string;
    nombre: string;
  };
}

export interface CambiarEstadoData {
  nuevoEstado: TareaEstado;
  comentario?: string;
}

export interface AsignarTareaData {
  usuarioId: string;
}

export interface AddComentarioData {
  comentario: string;
  tipo?: TipoComentario;
}

export interface TimelineEvent {
  tipo: 'comentario' | 'historial';
  fecha: string;
  usuario: {
    id: string;
    nombre: string;
  };
  data: ComentarioTarea | HistorialEstado;
}
