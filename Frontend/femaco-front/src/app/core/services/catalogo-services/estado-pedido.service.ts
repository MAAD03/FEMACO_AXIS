import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { EstadoPedido } from '../../models/catalogo-models/estado-pedido.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoPedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/estadoPedido`;
  private readonly STORAGE_KEY = 'estado_pedido_nombre_cache';
  private readonly estadoPedidoNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<EstadoPedido[]> {
    return this.http.get<EstadoPedido[]>(`${this.api}/buscar`);
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.estadoPedidoNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(estados => {
        const map = new Map<number, string>();

        estados.forEach(estado => {
          if (estado.idEstadoPedido != null) {
            map.set(estado.idEstadoPedido, estado.nombre ?? '');
          }
        });

        this.estadoPedidoNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idEstadoPedido: number | null | undefined): string {
    if (idEstadoPedido == null) return '—';

    const nombre = this.estadoPedidoNombreCache().get(idEstadoPedido);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idEstadoPedido}`;
  }

  clearCache(): void {
    this.estadoPedidoNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de estados de pedido:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de estados de pedido:', error);
    }
  }
}