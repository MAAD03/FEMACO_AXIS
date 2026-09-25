import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import { AreaArticuloService } from './area-articulo.service';
import { ArticuloService } from './articulo.service';
import { ClienteService } from './cliente.service';
import { MenuService } from './menu.service';
import { ModuloService } from './modulo.service';
import { OpcionService } from './opcion.service';
import { ProveedorService } from './proveedor.service';
import { RolService } from './rol.service';
import { SucursalService } from './sucursal.service';
import { UnidadMedidaService } from './unidad-medida.service';
import { UsuarioService } from './usuario.service';
import { EstadoArticuloService } from './catalogo-services/estado-articulo.service';
import { EstadoClienteService } from './catalogo-services/estado-cliente.service';
import { EstadoOrdenCompraService } from './catalogo-services/estado-orden-compra.service';
import { EstadoPedidoService } from './catalogo-services/estado-pedido.service';
import { EstadoProveedorService } from './catalogo-services/estado-proveedor.service';
import { EstadoUsuarioService } from './catalogo-services/estado-usuario.service';
import { EstadoVentaService } from './catalogo-services/estado-venta.service';
import { GeneroService } from './catalogo-services/genero.service';

@Injectable({
  providedIn: 'root'
})
export class CacheLoaderService {
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly articuloService = inject(ArticuloService);
  private readonly clienteService = inject(ClienteService);
  private readonly menuService = inject(MenuService);
  private readonly moduloService = inject(ModuloService);
  private readonly opcionService = inject(OpcionService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly rolService = inject(RolService);
  private readonly sucursalService = inject(SucursalService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly estadoArticuloService = inject(EstadoArticuloService);
  private readonly estadoClienteService = inject(EstadoClienteService);
  private readonly estadoOrdenCompraService = inject(EstadoOrdenCompraService);
  private readonly estadoPedidoService = inject(EstadoPedidoService);
  private readonly estadoProveedorService = inject(EstadoProveedorService);
  private readonly estadoUsuarioService = inject(EstadoUsuarioService);
  private readonly estadoVentaService = inject(EstadoVentaService);
  private readonly generoService = inject(GeneroService);

  private preload$: Observable<void> | null = null;

  loadAll(): Observable<void> {
    if (this.preload$) {
      return this.preload$;
    }

    this.preload$ = forkJoin([
      this.loadSafely('áreas de artículos', () => this.areaArticuloService.loadNombreCache()),
      this.loadSafely('artículos', () => this.articuloService.loadNombreCache()),
      this.loadSafely('clientes', () => this.clienteService.loadNombreCache()),
      this.loadSafely('menús', () => this.menuService.loadNombreCache()),
      this.loadSafely('módulos', () => this.moduloService.loadNombreCache()),
      this.loadSafely('opciones', () => this.opcionService.loadNombreCache()),
      this.loadSafely('proveedores', () => this.proveedorService.loadNombreCache()),
      this.loadSafely('roles', () => this.rolService.loadNombreCache()),
      this.loadSafely('sucursales', () => this.sucursalService.loadNombreCache()),
      this.loadSafely('unidades de medida', () => this.unidadMedidaService.loadAbreviaturaCache()),
      this.loadSafely('usuarios', () => this.usuarioService.loadEmailCache()),
      this.loadSafely('estados de artículos', () => this.estadoArticuloService.loadNombreCache()),
      this.loadSafely('estados de clientes', () => this.estadoClienteService.loadNombreCache()),
      this.loadSafely('estados de órdenes de compra', () => this.estadoOrdenCompraService.loadNombreCache()),
      this.loadSafely('estados de pedidos', () => this.estadoPedidoService.loadNombreCache()),
      this.loadSafely('estados de proveedores', () => this.estadoProveedorService.loadNombreCache()),
      this.loadSafely('estados de usuarios', () => this.estadoUsuarioService.loadNombreCache()),
      this.loadSafely('estados de ventas', () => this.estadoVentaService.loadNombreCache()),
      this.loadSafely('géneros', () => this.generoService.loadNombreCache())
    ]).pipe(
      map(() => void 0),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.preload$;
  }

  reset(): void {
    this.preload$ = null;
  }

  private loadSafely(name: string, load: () => Observable<void>): Observable<void> {
    return load().pipe(
      catchError((error: unknown) => {
        console.warn(`No se pudo cargar el caché de ${name}:`, error);
        return of(void 0);
      })
    );
  }
}
