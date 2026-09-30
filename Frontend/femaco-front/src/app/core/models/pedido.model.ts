export interface Pedido {
  idPedido?: number;
  fechaEntrega?: string | Date;
  direccionEntrega?: string;
  notasEntrega?: string;
  numeroEntrega?: string;
  productoDePedido?: string;
  idVenta?: number;
  idEstadoPedido?: number;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface PagePedido {
  content: Pedido[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PedidoFiltros {
  idPedido?: number;
  idVenta?: number;
  idEstadoPedido?: number;
  q?: string;
  numeroEntrega?: string;
  nitCliente?: string;
  numeroFactura?: string;
  fechaEntregaDesde?: string;
  fechaEntregaHasta?: string;
  fechaCreacionDesde?: string;
  fechaCreacionHasta?: string;
  page?: number;
  size?: number;
  sort?: string;
}