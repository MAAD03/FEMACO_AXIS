import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Opcion } from '../models/opcion.model';

@Injectable({
  providedIn: 'root'
})
export class OpcionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/opcion`;
  private readonly STORAGE_KEY = 'opcion_nombre_cache';
  private readonly opcionNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>(`${this.api}/buscar`);
  }

  crear(opcion: Opcion): Observable<Opcion> {
    return this.http.post<Opcion>(`${this.api}/crear`, opcion).pipe(
      tap((nuevaOpcion) => {
        if (nuevaOpcion?.idOpcion != null && nuevaOpcion.nombre) {
          this.upsertCacheEntry(nuevaOpcion.idOpcion, nuevaOpcion.nombre);
        }
      })
    );
  }

  actualizar(idOpcion: number, datos: Opcion): Observable<Opcion> {
    return this.http.put<Opcion>(`${this.api}/editar/${idOpcion}`, datos).pipe(
      tap((opcionActualizada) => {
        if (opcionActualizada?.idOpcion != null && opcionActualizada.nombre) {
          this.upsertCacheEntry(opcionActualizada.idOpcion, opcionActualizada.nombre);
        }
      })
    );
  }

  eliminar(idOpcion: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idOpcion}`).pipe(
      tap(() => this.removeCacheEntry(idOpcion))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.opcionNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(opciones => {
        const map = new Map<number, string>();

        opciones.forEach(o => {
          if (o.idOpcion != null) {
            map.set(o.idOpcion, o.nombre ?? '');
          }
        });

        this.opcionNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idOpcion: number | null | undefined): string {
    if (idOpcion == null) return '—';

    const nombre = this.opcionNombreCache().get(idOpcion);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idOpcion}`;
  }

  clearCache(): void {
    this.opcionNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de opciones:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de opciones:', error);
    }
  }

  private upsertCacheEntry(idOpcion: number, nombre: string): void {
    const map = new Map(this.opcionNombreCache());
    map.set(idOpcion, nombre);
    this.opcionNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idOpcion: number): void {
    const map = new Map(this.opcionNombreCache());
    map.delete(idOpcion);
    this.opcionNombreCache.set(map);
    this.persistCache(map);
  }
}