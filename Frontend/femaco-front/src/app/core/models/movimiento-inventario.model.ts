export interface MovimientoInventario {
  idMovimientoInventario?: number;
  tipoMovimiento: string;
  cantidad: number;
  stockViejo: number;
  stockNuevo: number;
  motivo: string;
  fechaCreacion?: string | Date;
  usuarioCreacion?: number;
  fechaModif?: string | Date;
  usuarioModif?: number;
  idArticulo?: number;
  idVenta?: number;
  idOrdenCompra?: number;
  idAjusteInventario?: number;
  idUsuario?: number;
}

export interface PageMovimientoInventario {
  content: MovimientoInventario[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
