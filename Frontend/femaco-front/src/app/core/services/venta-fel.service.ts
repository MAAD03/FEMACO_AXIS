import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface AnulacionFelRequest {
	motivo: string;
}

@Injectable({
	providedIn: 'root'
})
export class VentaFelService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = inject(API_BASE_URL);
	private readonly api = `${this.baseUrl}/ventas`;
	private readonly timeoutMs = 60000;

	certificar(idVenta: number): Observable<HttpResponse<Blob>> {
		return this.http.post(`${this.api}/${idVenta}/fel/certificar`, null, {
			observe: 'response',
			responseType: 'blob'
		}).pipe(timeout(this.timeoutMs));
	}

	anular(idVenta: number, motivo: string): Observable<HttpResponse<Blob>> {
		const request: AnulacionFelRequest = { motivo };

		return this.http.post(`${this.api}/${idVenta}/fel/anular`, request, {
			observe: 'response',
			responseType: 'blob'
		}).pipe(timeout(this.timeoutMs));
	}
}
