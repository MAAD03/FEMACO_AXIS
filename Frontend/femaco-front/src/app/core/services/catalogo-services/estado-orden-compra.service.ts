import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { EstadoOrdenCompra } from '../../models/catalogo-models/estado-orden-compra.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoOrdenCompraService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/estadoOrdenCompra`;
  private readonly STORAGE_KEY = 'estado_orden_compra_nombre_cache';
  private readonly estadoOrdenCompraNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<EstadoOrdenCompra[]> {
    return this.http.get<EstadoOrdenCompra[]>(`${this.api}/buscar`);
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.estadoOrdenCompraNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(estados => {
        const map = new Map<number, string>();

        estados.forEach(estado => {
          if (estado.idEstadoOrdenCompra != null) {
            map.set(estado.idEstadoOrdenCompra, estado.nombre ?? '');
          }
        });

        this.estadoOrdenCompraNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idEstadoOrdenCompra: number | null | undefined): string {
    if (idEstadoOrdenCompra == null) return '—';

    const nombre = this.estadoOrdenCompraNombreCache().get(idEstadoOrdenCompra);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idEstadoOrdenCompra}`;
  }

  clearCache(): void {
    this.estadoOrdenCompraNombreCache.set(new Map());
    this.cacheLoaded = false;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private restoreCacheFromStorage(): Map<number, string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return new Map();
      }

      const parsed = JSON.parse(stored) as Record<string, string>;
      return new Map(
        Object.entries(parsed).map(([key, value]) => [Number(key), value])
      );
    } catch (error) {
      console.warn('No se pudo restaurar el caché de estados de orden de compra:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de estados de orden de compra:', error);
    }
  }
}