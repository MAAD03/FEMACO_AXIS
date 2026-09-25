import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./components/Seguridad/login/login').then(m => m.Login)
  },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/Seguridad/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./components/Seguridad/menu/menu').then(m => m.Menu)
      },
      {
        path: 'modulo',
        loadComponent: () =>
          import('./components/Seguridad/modulo/modulo').then(m => m.modulo)
      },
      {
        path: 'rol',
        loadComponent: () =>
          import('./components/Seguridad/rol/rol').then(m => m.rol)
      },
      {
        path: 'opcion',
        loadComponent: () =>
          import('./components/Seguridad/opcion/opcion').then(m => m.Opcion)
      },
      {
        path: 'rol-opcion',
        loadComponent: () =>
          import('./components/Seguridad/rol-opcion/rol-opcion').then(m => m.RolOpcionComponent)
      },
      {
        path: 'usuario',
        loadComponent: () =>
          import('./components/Seguridad/usuario/usuario').then(m => m.Usuario)
      },
      {
        path: 'unidad-medida',
        loadComponent: () =>
          import('./components/Catalogo/unidad-medida/unidad-medida').then(m => m.UnidadMedida)
      },
      {
        path: 'ajuste-inventario',
        loadComponent: () =>
          import('./components/Inventario/ajuste-inventario/ajuste-inventario').then(m => m.AjusteInventario)
      },
      {
        path: 'area-articulo',
        loadComponent: () =>
          import('./components/Inventario/area-articulo/area-articulo').then(m => m.AreaArticulo)
      },
      {
        path: 'articulo',
        loadComponent: () =>
          import('./components/Inventario/articulo/articulo').then(m => m.Articulo)
      },
      {
        path: 'movimiento-inventario',
        loadComponent: () =>
          import('./components/Inventario/movimiento-inventario/movimiento-inventario').then(m => m.MovimientoInventario)
      },
      {
        path: 'cotizacion',
        loadComponent: () =>
          import('./components/SucursalCotizacion/cotizacion/cotizacion').then(m => m.Cotizacion)
      },
      {
        path: 'sucursal',
        loadComponent: () =>
          import('./components/SucursalCotizacion/sucursal/sucursal').then(m => m.Sucursal)
      },
      {
        path: 'orden-compra',
        loadComponent: () =>
          import('./components/Suministro/orden-compra/orden-compra').then(m => m.OrdenCompra)
      },
      {
        path: 'proveedor',
        loadComponent: () =>
          import('./components/Suministro/proveedor/proveedor').then(m => m.Proveedor)
      },
      {
        path: 'cliente',
        loadComponent: () =>
          import('./components/Ventas/cliente/cliente').then(m => m.Cliente)
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./components/Ventas/pedidos/pedidos').then(m => m.Pedidos)
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./components/Ventas/ventas/ventas').then(m => m.Ventas)
      },
      {
        path: 'lista-ventas',
        loadComponent: () =>
          import('./components/Ventas/lista-ventas/lista-ventas').then(m => m.ListaVentas)
      },
      {
        path: 'lista-ajuste-inventario',
        loadComponent: () =>
          import('./components/Inventario/lista-ajuste-inventario/lista-ajuste-inventario').then(m => m.ListaAjusteInventario)
      },
      {
        path: 'lista-orden-compra',
        loadComponent: () =>
          import('./components/Suministro/lista-orden-compra/lista-orden-compra').then(m => m.ListaOrdenCompra)
      },
      {
        path: 'datos-articulos',
        loadComponent: () =>
          import('./components/Datos/datos-articulos/datos-articulos').then(m => m.DatosArticulos)
      },
      {
        path: 'datos-venta',
        loadComponent: () =>
          import('./components/Datos/datos-venta/datos-venta').then(m => m.DatosVenta)
      }
    ]
  },

  { path: '**', redirectTo: '/dashboard' }
];