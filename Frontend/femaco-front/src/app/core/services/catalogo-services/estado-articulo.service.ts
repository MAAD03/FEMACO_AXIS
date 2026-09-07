import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { EstadoArticulo } from '../../models/catalogo-models/estado-articulo.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoArticuloService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/estadoArticulo`;
  private readonly STORAGE_KEY = 'estado_articulo_nombre_cache';
  private readonly estadoArticuloNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<EstadoArticulo[]> {
    return this.http.get<EstadoArticulo[]>(`${this.api}/buscar`);
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.estadoArticuloNombreCache.set(cachedMap);
    }

    return this.buscarTodos().pipe(
      tap(estados => {
        const map = new Map<number, string>();

        estados.forEach(estado => {
          if (estado.idEstadoArticulo != null) {
            map.set(estado.idEstadoArticulo, estado.nombre ?? '');
          }
        });

        this.estadoArticuloNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idEstadoArticulo: number | null | undefined): string {
    if (idEstadoArticulo == null) return '—';

    const nombre = this.estadoArticuloNombreCache().get(idEstadoArticulo);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idEstadoArticulo}`;
  }

  clearCache(): void {
    this.estadoArticuloNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de estados de artículo:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de estados de artículo:', error);
    }
  }
}