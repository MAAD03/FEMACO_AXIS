import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { RolOpcion } from '../models/rol-opcion.model';

@Injectable({
  providedIn: 'root'
})
export class RolOpcionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly api = `${this.baseUrl}/rolOpcion`;

  buscarTodos(): Observable<RolOpcion[]> {
    return this.http.get<RolOpcion[]>(`${this.api}/buscar`);
  }

  buscarPorIdRol(idRol: number): Observable<RolOpcion[]> {
    return this.http.get<RolOpcion[]>(`${this.api}/buscar/rol/${idRol}`);
  }

  crear(rolOpcion: RolOpcion): Observable<RolOpcion> {
    return this.http.post<RolOpcion>(`${this.api}/crear`, rolOpcion);
  }

  actualizar(idRolOpcion: number, datos: RolOpcion): Observable<RolOpcion> {
    return this.http.put<RolOpcion>(`${this.api}/editar/${idRolOpcion}`, datos);
  }

  eliminar(idRolOpcion: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${idRolOpcion}`);
  }
}