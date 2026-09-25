export interface VentaDetalle {
  idVentaDetalle?: number;
  cantidad: number;
  precioUnitario: number;
  subtotalBruto?: number;
  porcDescuentoMayorista?: number;
  montoDescuentoMayorista?: number;
  porcDescuentoManual?: number;
  montoDescuentoManual?: number;
  descuentoAplicado?: number;
  subtotal: number;
  idVenta?: number;
  idArticulo?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}