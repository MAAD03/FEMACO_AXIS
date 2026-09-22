import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PageUsuario, Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/usuario`;
  private readonly STORAGE_KEY = 'usuario_email_cache';
  private readonly emailCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.api}/buscar`);
  }

  buscarPagina(
    page = 0,
    size = 20,
    sort = 'idUsuario,asc'
  ): Observable<PageUsuario> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<PageUsuario>(`${this.api}/buscar-paginado`, { params });
  }

  crear(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.api}/crear`, usuario).pipe(
      tap((nuevoUsuario) => {
        if (nuevoUsuario?.idUsuario != null && nuevoUsuario.correoElectronico) {
          this.upsertCacheEntry(nuevoUsuario.idUsuario, nuevoUsuario.correoElectronico);
        }
      })
    );
  }

  actualizar(idUsuario: number, datos: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/editar/${idUsuario}`, datos).pipe(
      tap((usuarioActualizado) => {
        if (usuarioActualizado?.idUsuario != null && usuarioActualizado.correoElectronico) {
          this.upsertCacheEntry(usuarioActualizado.idUsuario, usuarioActualizado.correoElectronico);
        }
      })
    );
  }

  reiniciarPassword(idUsuario: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/reiniciar-password/${idUsuario}`, null).pipe(
      tap((usuarioActualizado) => {
        if (usuarioActualizado?.idUsuario != null && usuarioActualizado.correoElectronico) {
          this.upsertCacheEntry(usuarioActualizado.idUsuario, usuarioActualizado.correoElectronico);
        }
      })
    );
  }

  eliminar(idUsuario: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idUsuario}`).pipe(
      tap(() => this.removeCacheEntry(idUsuario))
    );
  }

  loadEmailCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.emailCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(usuarios => {
        const map = new Map<number, string>();

        usuarios.forEach(u => {
          if (u.idUsuario != null) {
            map.set(u.idUsuario, u.correoElectronico ?? '');
          }
        });

        this.emailCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getEmailById(idUsuario: number | null | undefined): string {
    if (idUsuario == null) return '—';

    const email = this.emailCache().get(idUsuario);
    if (email) {
      return email;
    }

    return `ID: ${idUsuario}`;
  }

  clearCache(): void {
    this.emailCache.set(new Map());
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
      console.warn('No se pudo restaurar el caché de emails:', error);
      return new Map();
    }
  }

  private persistCache(map: Map<number, string>): void {
    try {
      const payload = Object.fromEntries(map.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudo guardar el caché de emails:', error);
    }
  }

  private upsertCacheEntry(idUsuario: number, correo: string): void {
    const map = new Map(this.emailCache());
    map.set(idUsuario, correo);
    this.emailCache.set(map);
    this.persistCache(map);
  }

  private removeCacheEntry(idUsuario: number): void {
    const map = new Map(this.emailCache());
    map.delete(idUsuario);
    this.emailCache.set(map);
    this.persistCache(map);
  }
}
