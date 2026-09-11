export interface AjusteInventario {
  idAjusteInventario?: number;
  cantidadAjuste: number;
  motivo?: string;
  idArticulo?: number;
  idUsuario?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface AjusteInventarioCreateRequest {
  cantidad: number;
  motivo?: string;
  idArticulo: number;
  agregar: boolean;
  quitar: boolean;
}

export interface AjusteInventarioFiltro {
  q?: string;
  idArticulo?: number;
  correoUsuario?: string;
  fechaCreacionDesde?: string | Date;
  fechaCreacionHasta?: string | Date;
  tipoMovimiento?: string;
}

export interface PageAjusteInventario {
  content: AjusteInventario[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}