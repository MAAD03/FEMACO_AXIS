import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { UnidadMedida } from '../models/unidad-medida.model';

@Injectable({
  providedIn: 'root'
})

export class UnidadMedidaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/unidadMedida`;
  private readonly STORAGE_KEY = 'unidad_medida_abreviatura_cache';
  private readonly unidadAbreviaturaCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(`${this.api}/buscar`);
  }

  crear(unidadMedida: UnidadMedida): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(`${this.api}/crear`, unidadMedida).pipe(
      tap((nuevaUnidad) => {
        if (nuevaUnidad?.idUnidadMedida != null && nuevaUnidad.abreviatura) {
          this.upsertCacheEntry(nuevaUnidad.idUnidadMedida, nuevaUnidad.abreviatura);
        }
      })
    );
  }

  actualizar(idUnidadMedida: number, datos: UnidadMedida): Observable<UnidadMedida> {
    return this.http.put<UnidadMedida>(`${this.api}/editar/${idUnidadMedida}`, datos).pipe(
      tap((unidadActualizada) => {
        if (unidadActualizada?.idUnidadMedida != null && unidadActualizada.abreviatura) {
          this.upsertCacheEntry(unidadActualizada.idUnidadMedida, unidadActualizada.abreviatura);
        }
      })
    );
  }

  eliminar(idUnidadMedida: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idUnidadMedida}`).pipe(
      tap(() => this.removeCacheEntry(idUnidadMedida))
    );
  }

  loadAbreviaturaCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.unidadAbreviaturaCache.set(cachedMap);
    }

    return this.buscarTodos().pipe(
      tap((unidades) => {
        const map = new Map<number, string>();

        unidades.forEach((unidad) => {
          if (unidad.idUnidadMedida != null) {
            map.set(unidad.idUnidadMedida, unidad.abreviatura ?? '');
          }
        });

        this.unidadAbreviaturaCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getAbreviaturaById(idUnidadMedida: number | null | undefined): string {
    if (idUnidadMedida == null) return '—';

    const abreviatura = this.unidadAbreviaturaCache().get(idUnidadMedida);
    if (abreviatura) {
      return abreviatura;
    }

    return `ID: ${idUnidadMedida}`;
  }

  clearCache(): void {
    this.unidadAbreviaturaCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de abreviaturas de unidades de medida:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de abreviaturas de unidades de medida:', error);
    }
  }

  private upsertCacheEntry(idUnidadMedida: number, abreviatura: string): void {
    const map = new Map(this.unidadAbreviaturaCache());
    map.set(idUnidadMedida, abreviatura);
    this.unidadAbreviaturaCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idUnidadMedida: number): void {
    const map = new Map(this.unidadAbreviaturaCache());
    map.delete(idUnidadMedida);
    this.unidadAbreviaturaCache.set(map);
    this.persistCache(map);
  }
}