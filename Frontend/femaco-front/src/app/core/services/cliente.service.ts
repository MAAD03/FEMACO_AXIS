import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Cliente, PageCliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})

export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/cliente`;
  private readonly STORAGE_KEY = 'cliente_nombre_cache';
  private readonly clienteNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.api}/buscar`);
  }

  buscarPaginado(
    page: number = 0,
    size: number = 20,
    sort: string = 'nombre,asc'
  ): Observable<PageCliente> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sort.trim()) {
      params = params.set('sort', sort.trim());
    }

    return this.http.get<PageCliente>(`${this.api}/buscar-paginado`, { params });
  }

  buscarPorNit(nit: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.api}/buscar-por-nit/${encodeURIComponent(nit)}`);
  }

  crear(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.api}/crear`, cliente).pipe(
      tap((nuevoCliente) => {
        if (nuevoCliente?.idCliente != null && nuevoCliente.nombre) {
          this.upsertCacheEntry(nuevoCliente.idCliente, nuevoCliente.nombre);
        }
      })
    );
  }

  actualizar(idCliente: number, datos: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.api}/editar/${idCliente}`, datos).pipe(
      tap((clienteActualizado) => {
        if (clienteActualizado?.idCliente != null && clienteActualizado.nombre) {
          this.upsertCacheEntry(clienteActualizado.idCliente, clienteActualizado.nombre);
        }
      })
    );
  }

  eliminar(idCliente: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idCliente}`).pipe(
      tap(() => this.removeCacheEntry(idCliente))
    );
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.clienteNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap((clientes) => {
        const map = new Map<number, string>();

        clientes.forEach((cliente) => {
          if (cliente.idCliente != null) {
            map.set(cliente.idCliente, cliente.nombre ?? '');
          }
        });

        this.clienteNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idCliente: number | null | undefined): string {
    if (idCliente == null) return '—';

    const nombre = this.clienteNombreCache().get(idCliente);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idCliente}`;
  }

  clearCache(): void {
    this.clienteNombreCache.set(new Map<number, string>());
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
      console.warn('No se pudo restaurar el caché de clientes:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de clientes:', error);
    }
  }

  private upsertCacheEntry(idCliente: number, nombre: string): void {
    const map = new Map(this.clienteNombreCache());
    map.set(idCliente, nombre);
    this.clienteNombreCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idCliente: number): void {
    const map = new Map(this.clienteNombreCache());
    map.delete(idCliente);
    this.clienteNombreCache.set(map);
    this.persistCache(map);
  }
}