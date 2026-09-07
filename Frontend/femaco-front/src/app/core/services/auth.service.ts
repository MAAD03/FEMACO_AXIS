import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, UserData  } from '../models/auth.model';
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
import { EstadoSucursalService } from './catalogo-services/estado-sucursal.service';
import { EstadoUsuarioService } from './catalogo-services/estado-usuario.service';
import { EstadoVentaService } from './catalogo-services/estado-venta.service';
import { GeneroService } from './catalogo-services/genero.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
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
    private estadoSucursalService = inject(EstadoSucursalService);
    private estadoUsuarioService = inject(EstadoUsuarioService);
    private estadoVentaService = inject(EstadoVentaService);
    private generoService = inject(GeneroService);

  private readonly STORAGE_KEY = 'auth_user';
  private currentUserSubject = new BehaviorSubject<UserData | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

    login(credential: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, credential).pipe(
            tap(response => {
                const userData: UserData = {
                    token: response.token,
                    idUsuario: response.idUsuario,
                    nombre: response.nombre
                };
                this.saveUser(userData);
                this.currentUserSubject.next(userData);
            })
        );
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
        this.estadoSucursalService.clearCache();
        this.estadoUsuarioService.clearCache();
        this.estadoVentaService.clearCache();
        this.generoService.clearCache();
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

    private saveUser(user: UserData): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }
    
    private getUserFromStorage(): UserData | null {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }
}