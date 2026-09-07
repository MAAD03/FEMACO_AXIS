import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { EstadoSucursal } from '../../models/catalogo-models/estado-sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoSucursalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/estadoSucursal`;
  private readonly STORAGE_KEY = 'estado_sucursal_nombre_cache';
  private readonly estadoSucursalNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<EstadoSucursal[]> {
    return this.http.get<EstadoSucursal[]>(`${this.api}/buscar`);
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.estadoSucursalNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(estados => {
        const map = new Map<number, string>();

        estados.forEach(estado => {
          if (estado.idEstadoSucursal != null) {
            map.set(estado.idEstadoSucursal, estado.nombre ?? '');
          }
        });

        this.estadoSucursalNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idEstadoSucursal: number | null | undefined): string {
    if (idEstadoSucursal == null) return '—';

    const nombre = this.estadoSucursalNombreCache().get(idEstadoSucursal);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idEstadoSucursal}`;
  }

  clearCache(): void {
    this.estadoSucursalNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de estados de sucursal:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de estados de sucursal:', error);
    }
  }
}