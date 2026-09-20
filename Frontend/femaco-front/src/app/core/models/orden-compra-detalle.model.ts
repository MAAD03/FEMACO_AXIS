export interface OrdenCompraDetalle {
  idOrdenCompraDetalle?: number;
  cantidad: number;
  precioUnitario: number;
  total: number;
  idOrdenCompra?: number;
  idArticulo?: number;
  idEstadoOrdenCompra?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface OrdenCompraDetalleCreateRequest {
  idArticulo: number;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompraCreateRequest {
  idProveedor: number;
  notas?: string;
  detalles: OrdenCompraDetalleCreateRequest[];
}

export interface OrdenCompraDetalleUpdateRequest {
  idOrdenCompraDetalle: number;
  idArticulo?: number;
  cantidad: number;
  precioUnitario: number;
  idEstadoOrdenCompra?: number;
}

export interface OrdenCompraUpdateRequest {
  idOrdenCompra: number;
  idEstadoOrdenCompra?: number;
  notas?: string;
  detalles: OrdenCompraDetalleUpdateRequest[];
}