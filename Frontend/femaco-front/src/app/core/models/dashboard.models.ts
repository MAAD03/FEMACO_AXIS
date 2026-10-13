export type AgrupacionDashboard = 'DIA' | 'SEMANA' | 'MES';
export type OrdenTopProductos = 'UNIDADES' | 'MONTO';
export type OrdenRotacion = 'MAS_MOVIDOS' | 'MENOS_MOVIDOS';

export interface FiltroDashboard {
  desde?: string;
  hasta?: string;
}

export interface VentasPeriodo {
  periodo: string;
  cantidadVentas: number;
  subtotal: number;
  descuentoMayorista: number;
  descuentoManual: number;
  descuentoTotal: number;
  totalVentas: number;
}

export interface PeriodoResumen {
  desde: string;
  hasta: string;
  cantidadVentas: number;
  total: number;
  descuentos: number;
  ticketPromedio: number;
}

export interface ResumenVentas {
  fechaReferencia: string;
  hoy: PeriodoResumen;
  ayer: PeriodoResumen;
  mesActual: PeriodoResumen;
  mesAnteriorMismoPeriodo: PeriodoResumen;
  mesAnteriorCompleto: PeriodoResumen;
  variacionVsAyerPct: number | null;
  variacionMensualPct: number | null;
}

export interface TopProducto {
  idArticulo: number;
  codigo: string;
  nombre: string;
  unidadesVendidas: number;
  montoBruto: number;
  descuentos: number;
  montoVendido: number;
}

export interface VentaCliente {
  idCliente: number;
  nombre: string;
  nit: string;
  cantidadCompras: number;
  totalComprado: number;
  descuentosRecibidos: number;
}

export interface VentaVendedor {
  idUsuario: number;
  vendedor: string;
  cantidadVentas: number;
  totalVendido: number;
  descuentosAplicados: number;
}

export interface StockBajo {
  idArticulo: number;
  codigo: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  faltante: number;
}

export interface MovimientoPeriodo {
  periodo: string;
  tipoMovimiento: string;
  motivo: string;
  cantidadMovimientos: number;
  cantidadTotal: number;
  variacionNeta: number;
}

export interface HistorialMovimiento {
  idMovimientoInventario: number;
  tipoMovimiento: string;
  motivo: string;
  cantidad: number;
  stockViejo: number;
  stockNuevo: number;
  fecha: string;
  usuario: string;
}

export interface Rotacion {
  idArticulo: number;
  codigo: string;
  nombre: string;
  stockActual: number;
  totalSalidas: number;
  totalEntradas: number;
  ajusteNeto: number;
  cantidadMovimientos: number;
}

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}
