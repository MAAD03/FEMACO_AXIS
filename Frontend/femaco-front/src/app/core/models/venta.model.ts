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
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface VentaFiltro {
  fechaCreacionDesde?: string | Date;
  fechaCreacionHasta?: string | Date;
  nitCliente?: string;
  numeroFactura?: string;
  idEstadoVenta?: number;
  correoUsuario?: string;
}