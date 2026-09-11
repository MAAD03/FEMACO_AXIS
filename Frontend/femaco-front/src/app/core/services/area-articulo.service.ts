import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AreaArticulo } from '../models/area-articulo.model';

@Injectable({
  providedIn: 'root'
})

export class AreaArticuloService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/areaArticulo`;
  private readonly STORAGE_KEY = 'area_articulo_nombre_cache';
  private readonly areaNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<AreaArticulo[]> {
    return this.http.get<AreaArticulo[]>(`${this.api}/buscar`);
  }

  crear(areaArticulo: AreaArticulo): Observable<AreaArticulo> {
    return this.http.post<AreaArticulo>(`${this.api}/crear`, areaArticulo).pipe(
      tap((nuevaArea) => {
        if (nuevaArea?.idAreaArticulo != null && nuevaArea.nombre) {
          this.upsertCacheEntry(nuevaArea.idAreaArticulo, nuevaArea.nombre);
        }
      })
    );
  }

  actualizar(idAreaArticulo: number, datos: AreaArticulo): Observable<AreaArticulo> {
    return this.http.put<AreaArticulo>(`${this.api}/editar/${idAreaArticulo}`, datos).pipe(
      tap((areaActualizada) => {
        if (areaActualizada?.idAreaArticulo != null && areaActualizada.nombre) {
          this.upsertCacheEntry(areaActualizada.idAreaArticulo, areaActualizada.nombre);
        }
      })
    );
  }

  eliminar(idAreaArticulo: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idAreaArticulo}`).pipe(
      tap(() => this.removeCacheEntry(idAreaArticulo))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.areaNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap((areas) => {
        const map = new Map<number, string>();

        areas.forEach((area) => {
          if (area.idAreaArticulo != null) {
            map.set(area.idAreaArticulo, area.nombre ?? '');
          }
        });

        this.areaNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idAreaArticulo: number | null | undefined): string {
    if (idAreaArticulo == null) return '—';

    const nombre = this.areaNombreCache().get(idAreaArticulo);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idAreaArticulo}`;
  }

  clearCache(): void {
    this.areaNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de áreas de artículo:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de áreas de artículo:', error);
    }
  }

  private upsertCacheEntry(idAreaArticulo: number, nombre: string): void {
    const map = new Map(this.areaNombreCache());
    map.set(idAreaArticulo, nombre);
    this.areaNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idAreaArticulo: number): void {
    const map = new Map(this.areaNombreCache());
    map.delete(idAreaArticulo);
    this.areaNombreCache.set(map);
    this.persistCache(map);
  }
}