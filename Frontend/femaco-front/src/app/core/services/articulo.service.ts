import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Articulo, ArticuloFiltro, PageArticulo } from '../models/articulo.model';

@Injectable({
  providedIn: 'root'
})

export class ArticuloService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/articulo`;
  private readonly STORAGE_KEY = 'articulo_nombre_cache';
  private readonly articuloNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.api}/buscar`);
  }

  buscarPaginado(
    filtros: ArticuloFiltro = {},
    page: number = 0,
    size: number = 20,
    sort: string = 'nombre,asc'
  ): Observable<PageArticulo> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filtros.q?.trim()) {
      params = params.set('q', filtros.q.trim());
    }

    const numericFilters: Array<[keyof ArticuloFiltro, string]> = [
      ['idArea', 'idArea'],
      ['idEstado', 'idEstado'],
      ['idUnidad', 'idUnidad'],
      ['stockMin', 'stockMin'],
      ['stockMax', 'stockMax'],
      ['precioMin', 'precioMin'],
      ['precioMax', 'precioMax']
    ];

    numericFilters.forEach(([filterKey, paramKey]) => {
      const value = filtros[filterKey];
      if (typeof value === 'number') {
        params = params.set(paramKey, value);
      }
    });

    if (filtros.stockBajo === true) {
      params = params.set('stockBajo', 'true');
    }

    if (filtros.sinStock === true) {
      params = params.set('sinStock', 'true');
    }

    if (sort.trim()) {
      params = params.set('sort', sort.trim());
    }

    return this.http.get<PageArticulo>(`${this.api}/buscar-paginado`, { params });
  }

  crear(articulo: Articulo): Observable<Articulo> {
    return this.http.post<Articulo>(`${this.api}/crear`, articulo).pipe(
      tap((nuevoArticulo) => {
        if (nuevoArticulo?.idArticulo != null && nuevoArticulo.nombre) {
          this.upsertCacheEntry(nuevoArticulo.idArticulo, nuevoArticulo.nombre);
        }
      })
    );
  }

  actualizar(idArticulo: number, datos: Articulo): Observable<Articulo> {
    return this.http.put<Articulo>(`${this.api}/editar/${idArticulo}`, datos).pipe(
      tap((articuloActualizado) => {
        if (articuloActualizado?.idArticulo != null && articuloActualizado.nombre) {
          this.upsertCacheEntry(articuloActualizado.idArticulo, articuloActualizado.nombre);
        }
      })
    );
  }

  eliminar(idArticulo: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idArticulo}`).pipe(
      tap(() => this.removeCacheEntry(idArticulo))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.articuloNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap((articulos) => {
        const map = new Map<number, string>();

        articulos.forEach((articulo) => {
          if (articulo.idArticulo != null) {
            map.set(articulo.idArticulo, articulo.nombre ?? '');
          }
        });

        this.articuloNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idArticulo: number | null | undefined): string {
    if (idArticulo == null) return '—';

    const nombre = this.articuloNombreCache().get(idArticulo);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idArticulo}`;
  }

  clearCache(): void {
    this.articuloNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de artículos:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de artículos:', error);
    }
  }

  private upsertCacheEntry(idArticulo: number, nombre: string): void {
    const map = new Map<number, string>(this.articuloNombreCache());
    map.set(idArticulo, nombre);
    this.articuloNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idArticulo: number): void {
    const map = new Map<number, string>(this.articuloNombreCache());
    map.delete(idArticulo);
    this.articuloNombreCache.set(map);
    this.persistCache(map);
  }
}