import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PageMovimientoInventario } from '../models/movimiento-inventario.model';

@Injectable({
	providedIn: 'root'
})
export class MovimientoInventarioService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = inject(API_BASE_URL);
	private readonly api = `${this.baseUrl}/movimientoInventario`;

	buscarPaginado(
		page: number = 0,
		size: number = 20,
		sort: string = 'fechaCreacion,desc'
	): Observable<PageMovimientoInventario> {
		const params = new HttpParams()
			.set('page', page)
			.set('size', size)
			.set('sort', sort);

		return this.http.get<PageMovimientoInventario>(`${this.api}/buscar-paginado`, { params });
	}
}
