export interface Proveedor {
  idProveedor?: number;
  nombre: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  nombreContacto?: string;
  idEstadoProveedor?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface PageProveedor {
  content: Proveedor[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}