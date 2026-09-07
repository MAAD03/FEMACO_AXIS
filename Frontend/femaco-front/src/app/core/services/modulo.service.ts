import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Modulo } from '../models/modulo.model';

@Injectable({
  providedIn: 'root'
})
export class ModuloService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/modulo`;
  private readonly STORAGE_KEY = 'modulo_nombre_cache';
  private readonly moduloNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.api}/buscar`);
  }

  crear(modulo: Modulo): Observable<Modulo> {
    return this.http.post<Modulo>(`${this.api}/crear`, modulo).pipe(
      tap((nuevoModulo) => {
        if (nuevoModulo?.idModulo != null && nuevoModulo.nombre) {
          this.upsertCacheEntry(nuevoModulo.idModulo, nuevoModulo.nombre);
        }
      })
    );
  }

  actualizar(idModulo: number, datos: Modulo): Observable<Modulo> {
    return this.http.put<Modulo>(`${this.api}/editar/${idModulo}`, datos).pipe(
      tap((moduloActualizado) => {
        if (moduloActualizado?.idModulo != null && moduloActualizado.nombre) {
          this.upsertCacheEntry(moduloActualizado.idModulo, moduloActualizado.nombre);
        }
      })
    );
  }

  eliminar(idModulo: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idModulo}`).pipe(
      tap(() => this.removeCacheEntry(idModulo))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.moduloNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(modulos => {
        const map = new Map<number, string>();

        modulos.forEach(m => {
          if (m.idModulo != null) {
            map.set(m.idModulo, m.nombre ?? '');
          }
        });

        this.moduloNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idModulo: number | null | undefined): string {
    if (idModulo == null) return '—';

    const nombre = this.moduloNombreCache().get(idModulo);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idModulo}`;
  }

  clearCache(): void {
    this.moduloNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de módulos:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de módulos:', error);
    }
  }

  private upsertCacheEntry(idModulo: number, nombre: string): void {
    const map = new Map(this.moduloNombreCache());
    map.set(idModulo, nombre);
    this.moduloNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idModulo: number): void {
    const map = new Map(this.moduloNombreCache());
    map.delete(idModulo);
    this.moduloNombreCache.set(map);
    this.persistCache(map);
  }
}