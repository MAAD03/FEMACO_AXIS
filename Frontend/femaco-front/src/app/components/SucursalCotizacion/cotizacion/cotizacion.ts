import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Cotizacion as CotizacionModel, CotizacionConDetalles } from '../../../core/models/cotizacion.model';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { ArticuloService } from '../../../core/services/articulo.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';

@Component({
  selector: 'app-cotizacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ArticuloNombrePipe, UsuariosEmailPipe],
  templateUrl: './cotizacion.html',
  styleUrl: './cotizacion.css',
})
export class Cotizacion implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cotizacionService = inject(CotizacionService);
  private readonly articuloService = inject(ArticuloService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  readonly nitForm = this.fb.nonNullable.group({ nit: [''] });
  readonly lista = signal<CotizacionModel[]>([]);
  readonly cotizacionSeleccionada = signal<CotizacionConDetalles | null>(null);
  readonly cargando = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly error = signal('');
  readonly errorDetalle = signal('');
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];
  readonly tamanoPagina = signal(9);
  readonly buscandoPorNit = signal(false);

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('cotizacion');
  }

  ngOnInit(): void {
    this.articuloService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
    this.cargarLista();
  }

  buscar(): void {
    this.paginaActual.set(0);
    const nit = this.nitForm.controls.nit.value.trim();

    if (!nit) {
      this.buscandoPorNit.set(false);
      this.cargarLista();
      return;
    }

    this.buscarPorNit(nit);
  }

  limpiarBusqueda(): void {
    this.nitForm.reset({ nit: '' });
    this.paginaActual.set(0);
    this.buscandoPorNit.set(false);
    this.cargarLista();
  }

  cambiarTamano(): void {
    this.paginaActual.set(0);
    this.cargarLista();
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarLista();
  }

  verDetalle(idCotizacion?: number): void {
    if (idCotizacion == null) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cargandoDetalle.set(true);
    this.errorDetalle.set('');
    this.cotizacionService.buscarPorId(idCotizacion).subscribe({
      next: detalle => {
        this.cotizacionSeleccionada.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.errorDetalle.set('Error al cargar el detalle de la cotización');
        this.cargandoDetalle.set(false);
      },
    });
  }

  cerrarDetalle(): void {
    this.cotizacionSeleccionada.set(null);
    this.errorDetalle.set('');
  }

  private cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    this.cotizacionService.buscarPaginado(this.paginaActual(), this.tamanoPagina()).subscribe({
      next: pagina => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las cotizaciones');
        this.cargando.set(false);
      },
    });
  }

  private buscarPorNit(nit: string): void {
    this.cargando.set(true);
    this.error.set('');
    this.buscandoPorNit.set(true);

    this.cotizacionService.buscarPorNit(nit).subscribe({
      next: cotizacion => {
        this.lista.set(cotizacion ? [cotizacion] : []);
        this.totalElementos.set(cotizacion ? 1 : 0);
        this.totalPaginas.set(cotizacion ? 1 : 0);
        this.paginaActual.set(0);
        this.cargando.set(false);
      },
      error: () => {
        this.lista.set([]);
        this.totalElementos.set(0);
        this.totalPaginas.set(0);
        this.error.set('No se encontró una cotización para el NIT indicado');
        this.cargando.set(false);
      },
    });
  }
}
