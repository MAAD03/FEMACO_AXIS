import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PagePedido, Pedido } from '../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/pedido`;

  buscarPaginado(
    page = 0,
    size = 20,
    sort = 'fechaCreacion',
    direction: 'asc' | 'desc' = 'desc'
  ): Observable<PagePedido> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sort},${direction}`);

    return this.http.get<PagePedido>(`${this.api}/buscar`, { params });
  }

  crear(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.api}/crear`, pedido);
  }

  actualizar(idPedido: number, datos: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.api}/editar/${idPedido}`, datos);
  }
}