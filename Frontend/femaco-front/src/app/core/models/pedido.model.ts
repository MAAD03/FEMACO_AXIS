export interface Pedido {
  idPedido?: number;
  fechaEntrega?: string | Date;
  direccionEntrega?: string;
  notasEntrega?: string;
  numeroEntrega?: string;
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