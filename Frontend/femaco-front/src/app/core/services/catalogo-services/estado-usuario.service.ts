import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { EstadoUsuario } from '../../models/catalogo-models/estado-usuario.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/estadoUsuario`;
  private readonly STORAGE_KEY = 'estado_usuario_nombre_cache';
  private readonly estadoUsuarioNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<EstadoUsuario[]> {
    return this.http.get<EstadoUsuario[]>(`${this.api}/buscar`);
  }

  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.estadoUsuarioNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(estados => {
        const map = new Map<number, string>();

        estados.forEach(estado => {
          if (estado.idEstadoUsuario != null) {
            map.set(estado.idEstadoUsuario, estado.nombre ?? '');
          }
        });

        this.estadoUsuarioNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idEstadoUsuario: number | null | undefined): string {
    if (idEstadoUsuario == null) return '—';

    const nombre = this.estadoUsuarioNombreCache().get(idEstadoUsuario);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idEstadoUsuario}`;
  }

  clearCache(): void {
    this.estadoUsuarioNombreCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de estados de usuario:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de estados de usuario:', error);
    }
  }
}