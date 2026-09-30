import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  Cotizacion,
  CotizacionConDetalles,
  CotizacionCreateRequest,
  PageCotizacion,
} from '../models/cotizacion.model';

@Injectable({
  providedIn: 'root'
})

export class CotizacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/cotizacion`;
  private readonly comprobanteTimeoutMs = 60000;

  buscarPaginado(
    page = 0,
    size = 20,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc'
  ): Observable<PageCotizacion> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    return this.http.get<PageCotizacion>(`${this.api}/buscar`, { params });
  }

  buscarPorNit(nit: string): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(
      `${this.api}/buscar-por-nit/${encodeURIComponent(nit.trim())}`
    );
  }

  buscarPorId(idCotizacion: number): Observable<CotizacionConDetalles> {
    return this.http.get<CotizacionConDetalles>(`${this.api}/buscar/${idCotizacion}`);
  }

  crearConDetalles(dto: CotizacionCreateRequest): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.api}/crear-con-detalles`, dto);
  }

  generarComprobante(idCotizacion: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.api}/comprobante/${idCotizacion}`, {
      observe: 'response',
      responseType: 'blob'
    }).pipe(timeout(this.comprobanteTimeoutMs));
  }
}