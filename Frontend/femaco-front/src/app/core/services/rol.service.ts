import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Rol } from '../models/rol.model';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly api = `${this.baseUrl}/rol`;
  private readonly STORAGE_KEY = 'rol_nombre_cache';
  private readonly rolNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.api}/buscar`);
  }

  crear(rol: Rol): Observable<Rol> {
    return this.http.post<Rol>(`${this.api}/crear`, rol).pipe(
      tap((nuevoRol) => {
        if (nuevoRol?.idRol != null && nuevoRol.nombre) {
          this.upsertCacheEntry(nuevoRol.idRol, nuevoRol.nombre);
        }
      })
    );
  }

  actualizar(idRol: number, datos: Rol): Observable<Rol> {
    return this.http.put<Rol>(`${this.api}/editar/${idRol}`, datos).pipe(
      tap((rolActualizado) => {
        if (rolActualizado?.idRol != null && rolActualizado.nombre) {
          this.upsertCacheEntry(rolActualizado.idRol, rolActualizado.nombre);
        }
      })
    );
  }

  eliminar(idRol: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idRol}`).pipe(
      tap(() => this.removeCacheEntry(idRol))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.rolNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(roles => {
        const map = new Map<number, string>();

        roles.forEach(rol => {
          if (rol.idRol != null) {
            map.set(rol.idRol, rol.nombre ?? '');
          }
        });

        this.rolNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idRol: number | null | undefined): string {
    if (idRol == null) return '—';

    const nombre = this.rolNombreCache().get(idRol);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idRol}`;
  }

  clearCache(): void {
    this.rolNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de roles:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de roles:', error);
    }
  }

  private upsertCacheEntry(idRol: number, nombre: string): void {
    const map = new Map(this.rolNombreCache());
    map.set(idRol, nombre);
    this.rolNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idRol: number): void {
    const map = new Map(this.rolNombreCache());
    map.delete(idRol);
    this.rolNombreCache.set(map);
    this.persistCache(map);
  }
}