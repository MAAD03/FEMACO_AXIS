import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AjusteInventario,
  AjusteInventarioCreateRequest,
  AjusteInventarioFiltro,
  PageAjusteInventario,
} from '../models/ajuste-inventario.model';

@Injectable({
  providedIn: 'root'
})
export class AjusteInventarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/ajusteInventario`;

  buscarTodos(): Observable<AjusteInventario[]> {
    return this.http.get<AjusteInventario[]>(`${this.api}/buscar`);
  }

  buscarPaginado(
    filtros: AjusteInventarioFiltro = {},
    page: number = 0,
    size: number = 20,
    sort: string = 'fechaCreacion,desc'
  ): Observable<PageAjusteInventario> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filtros.q?.trim()) {
      params = params.set('q', filtros.q.trim());
    }

    if (filtros.idArticulo != null) {
      params = params.set('idArticulo', filtros.idArticulo);
    }

    if (filtros.correoUsuario?.trim()) {
      params = params.set('correoUsuario', filtros.correoUsuario.trim());
    }

    if (filtros.fechaCreacionDesde) {
      params = params.set('fechaCreacionDesde', this.formatDateParam(filtros.fechaCreacionDesde));
    }

    if (filtros.fechaCreacionHasta) {
      params = params.set('fechaCreacionHasta', this.formatDateParam(filtros.fechaCreacionHasta));
    }

    if (filtros.tipoMovimiento?.trim()) {
      params = params.set('tipoMovimiento', filtros.tipoMovimiento.trim());
    }

    if (sort.trim()) {
      params = params.set('sort', sort.trim());
    }

    return this.http.get<PageAjusteInventario>(`${this.api}/buscar-paginado`, { params });
  }

  crear(dto: AjusteInventarioCreateRequest): Observable<AjusteInventario> {
    return this.http.post<AjusteInventario>(`${this.api}/crear`, dto);
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