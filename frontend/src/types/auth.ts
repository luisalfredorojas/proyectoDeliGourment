export enum UserRole {
  ADMIN = 'ADMIN',
  ASISTENTE = 'ASISTENTE',
  PRODUCCION = 'PRODUCCION',
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  rol: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
