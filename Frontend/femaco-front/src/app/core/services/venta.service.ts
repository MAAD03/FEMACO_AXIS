import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Venta } from '../models/venta.model';
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
    page = 0,
    size = 20,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc'
  ): Observable<PageVenta> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    return this.http.get<PageVenta>(`${this.api}/buscar-paginado`, { params });
  }

  buscarPorId(idVenta: number): Observable<VentaConDetalles> {
    return this.http.get<VentaConDetalles>(`${this.api}/buscar/${idVenta}`);
  }

  crearConDetalles(dto: VentaCreateRequest): Observable<Venta> {
    return this.http.post<Venta>(`${this.api}/crear-con-detalles`, dto);
  }

  actualizar(idVenta: number, venta: Venta): Observable<Venta> {
    return this.http.put<Venta>(`${this.api}/editar/${idVenta}`, venta);
  }
}