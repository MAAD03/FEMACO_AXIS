export interface Cotizacion {
  idCotizacion?: number;
  fecha?: string | Date;
  nombre?: string;
  nit?: string;
  subtotal?: number;
  descuentoMayoristaTotal?: number;
  descuentoManualTotal?: number;
  descuentoTotal?: number;
  total?: number;
  idUsuario?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface PageCotizacion {
  content: Cotizacion[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CotizacionConDetalles {
  cotizacion: Cotizacion;
  detalles: import('./detalle-cotizacion.model').DetalleCotizacion[];
}

export interface CotizacionDetalleCreateRequest {
  idArticulo: number;
  cantidad: number;
  porcDescuentoManual?: number;
}

export interface CotizacionCreateRequest {
  nombre?: string;
  nit?: string;
  detalles: CotizacionDetalleCreateRequest[];
}