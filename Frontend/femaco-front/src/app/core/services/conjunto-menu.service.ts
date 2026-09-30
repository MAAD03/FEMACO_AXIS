import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ModuloMenu } from '../models/conjunto-menu.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ConjuntoMenuService {
  private http = inject(HttpClient);
  private apiBaseUrl = inject(API_BASE_URL);
  private readonly STORAGE_KEY = 'menu_usuario';

  private menuSubject = new BehaviorSubject<ModuloMenu[]>(this.getMenuFromStorage());
  public menu$ = this.menuSubject.asObservable();

  cargarMenu(): Observable<ModuloMenu[]> {
    return this.http.get<ModuloMenu[]>(`${this.apiBaseUrl}/conjuntoMenu/usuario`).pipe(
      tap(menu => {
        this.menuSubject.next(menu);
        this.saveMenu(menu);
      })
    );
  }

  getMenuActual(): ModuloMenu[] {
    return this.menuSubject.value;
  }

  limpiarMenu(): void {
    this.menuSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private saveMenu(menu: ModuloMenu[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(menu));
  }

  private getMenuFromStorage(): ModuloMenu[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data) as ModuloMenu[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  tienePermiso(idOpcion: number, tipo: 'alta' | 'baja' | 'cambio'): boolean {
    const menu = this.menuSubject.value;

    for (const modulo of menu) {
      for (const m of modulo.menus) {
        const opcion = m.opciones.find(o => o.idOpcion === idOpcion);
        if (opcion) {
          return opcion[tipo];
        }
      }
    }
    return false;
  }

  getPermisosPorPagina(pagina: string): { alta: boolean; baja: boolean; cambio: boolean } {
  const menu = this.menuSubject.value;
  for (const modulo of menu) {
    for (const m of modulo.menus) {
      const opcion = m.opciones.find(o => o.pagina === pagina || o.pagina === '/' + pagina);
      if (opcion) {
        return {
          alta: opcion.alta,
          baja: opcion.baja,
          cambio: opcion.cambio
          };
        }
      }
    }
  return { alta: false, baja: false, cambio: false };
  }

  tienePagina(pagina: string): boolean {
    const menu = this.menuSubject.value;
    return menu.some(modulo =>
      modulo.menus.some(m =>
        m.opciones.some(opcion => opcion.pagina === pagina || opcion.pagina === '/' + pagina)
      )
    );
  }

}