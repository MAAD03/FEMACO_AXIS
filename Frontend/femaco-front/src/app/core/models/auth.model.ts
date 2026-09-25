export interface LoginRequest {
  correoElectronico: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  idUsuario: number;
  nombre: string;
  PuedeAplicarDescuento: boolean;
}

export interface LoginErrorResponse {
  mensaje?: string;
  motivo?: string;
  message?: string;
  error?: string;
  intentosFallidos?: number;
  requiereCambioPassword?: boolean;
  RequiereCambioPassword?: boolean;
}

export interface LoginApiError {
  status: number;
  mensaje: string;
  motivo?: string;
  intentosFallidos: number;
  requiereCambioPassword: boolean;
}

export interface CambioPasswordRequest {
  correoElectronico: string;
  nuevaPassword: string;
}

export interface CambioPasswordResponse {
  mensaje?: string;
  error?: string;
}

export interface UserData {
  token: string;
  idUsuario: number;
  nombre: string;
  PuedeAplicarDescuento: boolean;
}