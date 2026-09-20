export interface OrdenCompra {
  idOrdenCompra?: number;
  total?: number;
  notas?: string;
  idProveedor?: number;
  idEstadoOrdenCompra?: number;
  idUsuario?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface PageOrdenCompra {
  content: OrdenCompra[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}