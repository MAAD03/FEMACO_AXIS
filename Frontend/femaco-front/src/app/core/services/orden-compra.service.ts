import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { OrdenCompra, PageOrdenCompra } from '../models/orden-compra.model';
import {
  OrdenCompraDetalleCreateRequest,
  OrdenCompraDetalleUpdateRequest,
  OrdenCompraCreateRequest,
  OrdenCompraUpdateRequest,
} from '../models/orden-compra-detalle.model';

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/ordenCompra`;

  buscar(page = 0, size = 20, sort = 'fechaCreacion', direction: 'asc' | 'desc' = 'desc'): Observable<PageOrdenCompra> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    return this.http.get<PageOrdenCompra>(`${this.api}/buscar`, { params });
  }

  buscarPaginado(page = 0, size = 20, sort = 'fechaCreacion', direction: 'asc' | 'desc' = 'desc'): Observable<PageOrdenCompra> {
    return this.buscar(page, size, sort, direction);
  }

  crearConDetalles(dto: OrdenCompraCreateRequest): Observable<OrdenCompra> {
    return this.http.post<OrdenCompra>(`${this.api}/crear-con-detalles`, dto);
  }

  actualizarConDetalles(dto: OrdenCompraUpdateRequest): Observable<OrdenCompra> {
    return this.http.put<OrdenCompra>(`${this.api}/actualizar-con-detalles`, dto);
  }
}