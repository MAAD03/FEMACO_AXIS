export interface Articulo {
  idArticulo?: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  stockActual?: number;
  stockMinimo?: number;
  precioCompraUltimoProveedor?: number;
  margenGanancia?: number;
  cantidadMinimaDescuento?: number;
  descuentoMayorista?: number;
  idAreaArticulo?: number;
  idUnidadMedida?: number;
  idEstadoArticulo?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface ArticuloFiltro {
  q?: string;
  idArea?: number;
  idEstado?: number;
  idUnidad?: number;
  stockBajo?: boolean;
  sinStock?: boolean;
  stockMin?: number;
  stockMax?: number;
  precioMin?: number;
  precioMax?: number;
}

export interface PageArticulo {
  content: Articulo[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}