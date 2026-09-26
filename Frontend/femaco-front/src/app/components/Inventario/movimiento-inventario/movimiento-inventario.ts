import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { MovimientoInventarioService } from '../../../core/services/movimiento-inventario.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { MovimientoInventario as MovimientoInventarioModel } from '../../../core/models/movimiento-inventario.model';

@Component({
  selector: 'app-movimiento-inventario',
  standalone: true,
  imports: [CommonModule, ArticuloNombrePipe, UsuariosEmailPipe],
  templateUrl: './movimiento-inventario.html',
  styleUrl: './movimiento-inventario.css',
})
export class MovimientoInventario implements OnInit {
  private readonly movimientoInventarioService = inject(MovimientoInventarioService);
  private readonly articuloService = inject(ArticuloService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  lista = signal<MovimientoInventarioModel[]>([]);
  cargando = signal(false);
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [10, 20, 30, 50];
  tamanoPagina = signal(20);

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('movimiento-inventario');
  }

  ngOnInit(): void {
    this.articuloService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
    this.cargarLista();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    this.movimientoInventarioService.buscarPaginado(this.paginaActual(), this.tamanoPagina()).subscribe({
      next: pagina => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el libro de movimientos de inventario');
        this.cargando.set(false);
      },
    });
  }

  cambiarTamano(tamano: string): void {
    this.tamanoPagina.set(Number(tamano) || 20);
    this.paginaActual.set(0);
    this.cargarLista();
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) {
      return;
    }

    this.paginaActual.set(pagina);
    this.cargarLista();
  }
}
