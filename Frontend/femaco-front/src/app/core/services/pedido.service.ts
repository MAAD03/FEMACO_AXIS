import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PagePedido, Pedido, PedidoFiltros } from '../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/pedido`;

  buscarPaginado(filtros: PedidoFiltros = {}): Observable<PagePedido> {
    const params = Object.entries({
      page: 0,
      size: 20,
      sort: 'fechaCreacion,desc',
      ...filtros,
    }).reduce((resultado, [clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        resultado = resultado.set(clave, String(valor));
      }
      return resultado;
    }, new HttpParams());

    return this.http.get<PagePedido>(`${this.api}/buscar`, { params });
  }

  buscarPendientes(
    page = 0,
    size = 10,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc'
  ): Observable<PagePedido> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    return this.http.get<PagePedido>(`${this.api}/buscar-pendientes`, { params });
  }

  crear(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.api}/crear`, pedido);
  }

  actualizar(idPedido: number, datos: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.api}/editar/${idPedido}`, datos);
  }

  generarListadoEntrega(idPedido: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.api}/listado-entrega/${idPedido}`, {
      observe: 'response',
      responseType: 'blob',
    });
  }
}