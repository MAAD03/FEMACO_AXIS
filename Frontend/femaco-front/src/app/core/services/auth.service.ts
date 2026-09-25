import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import {
  CambioPasswordRequest,
  CambioPasswordResponse,
  LoginApiError,
  LoginErrorResponse,
  LoginRequest,
  LoginResponse,
  UserData
} from '../models/auth.model';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';
import { ConjuntoMenuService } from './conjunto-menu.service';
import { MenuService } from './menu.service';
import { ModuloService } from './modulo.service';
import { OpcionService } from './opcion.service';
import { UsuarioService } from './usuario.service';
import { AreaArticuloService } from './area-articulo.service';
import { ArticuloService } from './articulo.service';
import { UnidadMedidaService } from './unidad-medida.service';
import { RolService } from './rol.service';
import { SucursalService } from './sucursal.service';
import { EstadoArticuloService } from './catalogo-services/estado-articulo.service';
import { EstadoClienteService } from './catalogo-services/estado-cliente.service';
import { EstadoOrdenCompraService } from './catalogo-services/estado-orden-compra.service';
import { EstadoPedidoService } from './catalogo-services/estado-pedido.service';
import { EstadoProveedorService } from './catalogo-services/estado-proveedor.service';
import { EstadoUsuarioService } from './catalogo-services/estado-usuario.service';
import { EstadoVentaService } from './catalogo-services/estado-venta.service';
import { GeneroService } from './catalogo-services/genero.service';
import { CacheLoaderService } from './cache-loader.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private httpBackend = inject(HttpBackend);
  private rawHttp = new HttpClient(this.httpBackend);
  private router = inject(Router);
  private apiBaseUrl = inject(API_BASE_URL);
  private conjuntoMenuService = inject(ConjuntoMenuService);
  private menuService = inject(MenuService);
  private moduloService = inject(ModuloService);
  private opcionService = inject(OpcionService);
  private usuarioService = inject(UsuarioService);
  private areaArticuloService = inject(AreaArticuloService);
  private articuloService = inject(ArticuloService);
  private unidadMedidaService = inject(UnidadMedidaService);
  private rolService = inject(RolService);
  private sucursalService = inject(SucursalService);
  private estadoArticuloService = inject(EstadoArticuloService);
  private estadoClienteService = inject(EstadoClienteService);
  private estadoOrdenCompraService = inject(EstadoOrdenCompraService);
  private estadoPedidoService = inject(EstadoPedidoService);
  private estadoProveedorService = inject(EstadoProveedorService);
  private estadoUsuarioService = inject(EstadoUsuarioService);
  private estadoVentaService = inject(EstadoVentaService);
  private generoService = inject(GeneroService);
  private cacheLoaderService = inject(CacheLoaderService);

  private readonly STORAGE_KEY = 'auth_user';
  private currentUserSubject = new BehaviorSubject<UserData | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  login(credential: LoginRequest): Observable<LoginResponse> {
    return this.rawHttp.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, credential).pipe(
      tap((response) => {
        const userData: UserData = {
          token: response.token,
          idUsuario: response.idUsuario,
          nombre: response.nombre,
          PuedeAplicarDescuento: response.PuedeAplicarDescuento
        };
        this.saveUser(userData);
        this.currentUserSubject.next(userData);
      }),
      catchError((error: unknown) => throwError(() => this.normalizeLoginError(error)))
    );
  }

  cambiarPassword(request: CambioPasswordRequest): Observable<CambioPasswordResponse> {
    return this.http.post<CambioPasswordResponse>(`${this.apiBaseUrl}/auth/cambiar-password`, request);
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.conjuntoMenuService.limpiarMenu();
    this.menuService.clearCache();
    this.moduloService.clearCache();
    this.opcionService.clearCache();
    this.usuarioService.clearCache();
    this.areaArticuloService.clearCache();
    this.articuloService.clearCache();
    this.unidadMedidaService.clearCache();
    this.rolService.clearCache();
    this.sucursalService.clearCache();
    this.estadoArticuloService.clearCache();
    this.estadoClienteService.clearCache();
    this.estadoOrdenCompraService.clearCache();
    this.estadoPedidoService.clearCache();
    this.estadoProveedorService.clearCache();
    this.estadoUsuarioService.clearCache();
    this.estadoVentaService.clearCache();
    this.generoService.clearCache();
    this.cacheLoaderService.reset();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getUserFromStorage()?.token || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  private normalizeLoginError(error: unknown): LoginApiError {
    const httpError = error as HttpErrorResponse;
    const body = (httpError?.error && typeof httpError.error === 'object')
      ? (httpError.error as LoginErrorResponse)
      : {};

    const requiereCambioPassword = body.requiereCambioPassword === true || body.RequiereCambioPassword === true;
    const intentosFallidos = typeof body.intentosFallidos === 'number' ? body.intentosFallidos : 0;
    const motivo = body.motivo ?? body.mensaje;
    const mensaje = body.mensaje ?? body.motivo ?? 'Error al iniciar sesión. Intenta de nuevo.';

    return {
      status: typeof httpError?.status === 'number' ? httpError.status : 0,
      mensaje,
      motivo,
      intentosFallidos,
      requiereCambioPassword
    };
  }

  private saveUser(user: UserData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private getUserFromStorage(): UserData | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
}