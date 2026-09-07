import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Menu } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/menu`;
  private readonly STORAGE_KEY = 'menu_nombre_cache';
  private readonly menuNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.api}/buscar`);
  }

  crear(menu: Menu): Observable<Menu> {
    return this.http.post<Menu>(`${this.api}/crear`, menu).pipe(
      tap((nuevoMenu) => {
        if (nuevoMenu?.idMenu != null && nuevoMenu.nombre) {
          this.upsertCacheEntry(nuevoMenu.idMenu, nuevoMenu.nombre);
        }
      })
    );
  }

  actualizar(idMenu: number, datos: Menu): Observable<Menu> {
    return this.http.put<Menu>(`${this.api}/editar/${idMenu}`, datos).pipe(
      tap((menuActualizado) => {
        if (menuActualizado?.idMenu != null && menuActualizado.nombre) {
          this.upsertCacheEntry(menuActualizado.idMenu, menuActualizado.nombre);
        }
      })
    );
  }

  eliminar(idMenu: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idMenu}`).pipe(
      tap(() => this.removeCacheEntry(idMenu))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.menuNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(menus => {
        const map = new Map<number, string>();

        menus.forEach(m => {
          if (m.idMenu != null) {
            map.set(m.idMenu, m.nombre ?? '');
          }
        });

        this.menuNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idMenu: number | null | undefined): string {
    if (idMenu == null) return '—';

    const nombre = this.menuNombreCache().get(idMenu);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idMenu}`;
  }

  clearCache(): void {
    this.menuNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de menús:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de menús:', error);
    }
  }

  private upsertCacheEntry(idMenu: number, nombre: string): void {
    const map = new Map(this.menuNombreCache());
    map.set(idMenu, nombre);
    this.menuNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idMenu: number): void {
    const map = new Map(this.menuNombreCache());
    map.delete(idMenu);
    this.menuNombreCache.set(map);
    this.persistCache(map);
  }
}