import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Sucursal } from '../models/sucursal.model';

@Injectable({
  providedIn: 'root'
})

export class SucursalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/sucursal`;
  private readonly STORAGE_KEY = 'sucursal_nombre_cache';
  private readonly sucursalNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.api}/buscar`);
  }

  crear(sucursal: Sucursal): Observable<Sucursal> {
    return this.http.post<Sucursal>(`${this.api}/crear`, sucursal).pipe(
      tap((nuevaSucursal) => {
        if (nuevaSucursal?.idSucursal != null && nuevaSucursal.nombre) {
          this.upsertCacheEntry(nuevaSucursal.idSucursal, nuevaSucursal.nombre);
        }
      })
    );
  }

  actualizar(idSucursal: number, datos: Sucursal): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.api}/editar/${idSucursal}`, datos).pipe(
      tap((sucursalActualizada) => {
        if (sucursalActualizada?.idSucursal != null && sucursalActualizada.nombre) {
          this.upsertCacheEntry(sucursalActualizada.idSucursal, sucursalActualizada.nombre);
        }
      })
    );
  }

  eliminar(idSucursal: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idSucursal}`).pipe(
      tap(() => this.removeCacheEntry(idSucursal))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.sucursalNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap((sucursales) => {
        const map = new Map<number, string>();

        sucursales.forEach((sucursal) => {
          if (sucursal.idSucursal != null) {
            map.set(sucursal.idSucursal, sucursal.nombre ?? '');
          }
        });

        this.sucursalNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idSucursal: number | null | undefined): string {
    if (idSucursal == null) return '—';

    const nombre = this.sucursalNombreCache().get(idSucursal);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idSucursal}`;
  }

  clearCache(): void {
    this.sucursalNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de sucursales:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de sucursales:', error);
    }
  }

  private upsertCacheEntry(idSucursal: number, nombre: string): void {
    const map = new Map(this.sucursalNombreCache());
    map.set(idSucursal, nombre);
    this.sucursalNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idSucursal: number): void {
    const map = new Map(this.sucursalNombreCache());
    map.delete(idSucursal);
    this.sucursalNombreCache.set(map);
    this.persistCache(map);
  }
}