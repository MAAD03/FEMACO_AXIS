export interface Cliente {
  idCliente?: number;
  nit: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  idEstadoCliente?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface PageCliente {
  content: Cliente[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}