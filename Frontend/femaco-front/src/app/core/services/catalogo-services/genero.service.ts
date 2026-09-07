import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { Genero } from '../../models/catalogo-models/genero.model'; 

@Injectable({
  providedIn: 'root'
})
export class GeneroService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = `${this.baseUrl}/genero`;
  private readonly STORAGE_KEY = 'genero_nombre_cache';
  private readonly generoNombreCache = signal<Map<number, string>>(this.restoreCacheFromStorage());
  private cacheLoaded = false;

  buscarTodos(): Observable<Genero[]> {
    return this.http.get<Genero[]>(`${this.api}/buscar`);
  }


  loadNombreCache(): Observable<void> {
    if (this.cacheLoaded) {
      return of(void 0);
    }

    const cachedMap = this.restoreCacheFromStorage();
    if (cachedMap.size > 0) {
      this.generoNombreCache.set(cachedMap);
      this.cacheLoaded = true;
      return of(void 0);
    }

    return this.buscarTodos().pipe(
      tap(generos => {
        const map = new Map<number, string>();

        generos.forEach(genero => {
          if (genero.idGenero != null) {
            map.set(genero.idGenero, genero.nombre ?? '');
          }
        });

        this.generoNombreCache.set(map);
        this.cacheLoaded = true;
        this.persistCache(map);
      }),
      map(() => void 0)
    );
  }

  getNombreById(idGenero: number | null | undefined): string {
    if (idGenero == null) return '—';

    const nombre = this.generoNombreCache().get(idGenero);
    if (nombre) {
      return nombre;
    }

    return `ID: ${idGenero}`;
  }

  clearCache(): void {
    this.generoNombreCache.set(new Map());
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
      console.warn('No se pudo guardar el caché de generos:', error);
    }
  }


}