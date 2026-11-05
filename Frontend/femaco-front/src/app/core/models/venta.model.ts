export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'CHEQUE' | 'TRANSFERENCIA' | 'DEPOSITO';

export interface Venta {
  idVenta?: number;
  fecha?: string | Date;
  subtotal?: number;
  descuentoMayoristaTotal?: number;
  descuentoManualTotal?: number;
  descuentoTotal?: number;
  total?: number;
  esPedido?: boolean;
  numeroFactura?: string;
  idEstadoVenta?: number;
  idCliente?: number;
  idUsuario?: number;
  metodoPago?: MetodoPago | null;
  referenciaPago?: string | null;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface VentaPagoRequest {
  metodoPago: MetodoPago;
  referenciaPago?: string | null;
}

export interface VentaFiltro {
  fechaCreacionDesde?: string | Date;
  fechaCreacionHasta?: string | Date;
  nitCliente?: string;
  numeroFactura?: string;
  idEstadoVenta?: number;
  correoUsuario?: string;
}