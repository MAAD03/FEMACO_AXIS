import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Venta, VentaFiltro } from '../models/venta.model';
import { VentaDetalle } from '../models/venta-detalle.model';

export interface PageVenta {
  content: Venta[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface VentaConDetalles {
  venta: Venta;
  detalles: VentaDetalle[];
  estadoDocumento: string;
}

export interface VentaDetalleCreateRequest {
  idArticulo: number;
  cantidad: number;
  porcDescuentoManual?: number;
}

export interface VentaCreateRequest {
  idCliente?: number;
  consumidorFinal?: boolean;
  detalles: VentaDetalleCreateRequest[];
}

@Injectable({
  providedIn: 'root'
})

export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/ventas`;

  buscarPaginado(
    filtros: VentaFiltro = {},
    page = 0,
    size = 20,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc'
  ): Observable<PageVenta> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    if (filtros.fechaCreacionDesde) {
      params = params.set('fechaCreacionDesde', this.formatDateParam(filtros.fechaCreacionDesde));
    }

    if (filtros.fechaCreacionHasta) {
      params = params.set('fechaCreacionHasta', this.formatDateParam(filtros.fechaCreacionHasta));
    }

    if (filtros.nitCliente?.trim()) {
      params = params.set('nitCliente', filtros.nitCliente.trim());
    }

    if (filtros.numeroFactura?.trim()) {
      params = params.set('numeroFactura', filtros.numeroFactura.trim());
    }

    if (filtros.idEstadoVenta != null) {
      params = params.set('idEstadoVenta', filtros.idEstadoVenta);
    }

    if (filtros.correoUsuario?.trim()) {
      params = params.set('correoUsuario', filtros.correoUsuario.trim());
    }

    return this.http.get<PageVenta>(`${this.api}/buscar-paginado`, { params });
  }

  buscarPorId(idVenta: number): Observable<VentaConDetalles> {
    return this.http.get<VentaConDetalles>(`${this.api}/buscar/${idVenta}`);
  }

  crearConDetalles(dto: VentaCreateRequest): Observable<Venta> {
    return this.http.post<Venta>(`${this.api}/crear-con-detalles`, dto);
  }

  anular(idVenta: number): Observable<Venta> {
    return this.http.put<Venta>(`${this.api}/anular/${idVenta}`, null);
  }

  private formatDateParam(value: string | Date): string {
    if (typeof value === 'string') {
      return value;
    }

    const normalized = new Date(value);
    if (Number.isNaN(normalized.getTime())) {
      return '';
    }

    return normalized.toISOString().slice(0, 10);
  }
}