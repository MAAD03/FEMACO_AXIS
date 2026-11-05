import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
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
  private readonly comprobanteTimeoutMs = 60000;

  buscar(
    page = 0,
    size = 20,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc',
    idProveedor?: number
  ): Observable<PageOrdenCompra> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    if (idProveedor != null) {
      params = params.set('idProveedor', idProveedor.toString());
    }

    return this.http.get<PageOrdenCompra>(`${this.api}/buscar`, { params });
  }

  buscarPaginado(
    page = 0,
    size = 20,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc',
    idProveedor?: number
  ): Observable<PageOrdenCompra> {
    return this.buscar(page, size, sort, direction, idProveedor);
  }

  buscarPorId(idOrdenCompra: number): Observable<any> {
    return this.http.get<any>(`${this.api}/buscar/${idOrdenCompra}`);
  }

  generarComprobante(idOrdenCompra: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.api}/comprobante/${idOrdenCompra}`, {
      observe: 'response',
      responseType: 'blob',
    }).pipe(timeout(this.comprobanteTimeoutMs));
  }

  crearConDetalles(dto: OrdenCompraCreateRequest): Observable<OrdenCompra> {
    return this.http.post<OrdenCompra>(`${this.api}/crear-con-detalles`, dto);
  }

  actualizarConDetalles(dto: OrdenCompraUpdateRequest): Observable<OrdenCompra> {
    return this.http.put<OrdenCompra>(`${this.api}/actualizar-con-detalles`, dto);
  }
}