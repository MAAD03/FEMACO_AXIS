import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Proveedor } from '../models/proveedor.model';

@Injectable({
  providedIn: 'root'
})

export class ProveedorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/proveedor`;
  private readonly STORAGE_KEY = 'proveedor_nombre_cache';
  private readonly proveedorNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.api}/buscar`);
  }

  buscarProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.api}/buscarProveedores`);
  }

  crear(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.api}/crear`, proveedor).pipe(
      tap((nuevoProveedor) => {
        if (nuevoProveedor?.idProveedor != null && nuevoProveedor.nombre) {
          this.upsertCacheEntry(nuevoProveedor.idProveedor, nuevoProveedor.nombre);
        }
      })
    );
  }

  actualizar(idProveedor: number, datos: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.api}/editar/${idProveedor}`, datos).pipe(
      tap((proveedorActualizado) => {
        if (proveedorActualizado?.idProveedor != null && proveedorActualizado.nombre) {
          this.upsertCacheEntry(proveedorActualizado.idProveedor, proveedorActualizado.nombre);
        }
      })
    );
  }

  eliminar(idProveedor: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idProveedor}`).pipe(
      tap(() => this.removeCacheEntry(idProveedor))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.proveedorNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap((proveedores) => {
        const map = new Map<number, string>();

        proveedores.forEach((proveedor) => {
          if (proveedor.idProveedor != null) {
            map.set(proveedor.idProveedor, proveedor.nombre ?? '');
          }
        });

        this.proveedorNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idProveedor: number | null | undefined): string {
    if (idProveedor == null) return '—';

    const nombre = this.proveedorNombreCache().get(idProveedor);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idProveedor}`;
  }

  clearCache(): void {
    this.proveedorNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de proveedores:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de proveedores:', error);
    }
  }

  private upsertCacheEntry(idProveedor: number, nombre: string): void {
    const map = new Map(this.proveedorNombreCache());
    map.set(idProveedor, nombre);
    this.proveedorNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idProveedor: number): void {
    const map = new Map(this.proveedorNombreCache());
    map.delete(idProveedor);
    this.proveedorNombreCache.set(map);
    this.persistCache(map);
  }
}