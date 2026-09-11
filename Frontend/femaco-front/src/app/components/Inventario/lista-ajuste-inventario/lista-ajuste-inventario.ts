import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AjusteInventario, AjusteInventarioFiltro } from '../../../core/models/ajuste-inventario.model';
import { AjusteInventarioService } from '../../../core/services/ajuste-invetario.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';

@Component({
  selector: 'app-lista-ajuste-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UsuariosEmailPipe, ArticuloNombrePipe],
  templateUrl: './lista-ajuste-inventario.html',
  styleUrl: './lista-ajuste-inventario.css',
})
export class ListaAjusteInventario implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ajusteInventarioService = inject(AjusteInventarioService);
  private readonly articuloService = inject(ArticuloService);
  private readonly usuarioService = inject(UsuarioService);

  filtrosForm!: FormGroup;
  lista = signal<AjusteInventario[]>([]);
  cargando = signal(false);
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  ngOnInit(): void {
    this.initForms();
    this.articuloService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
    this.cargarLista();
  }

  private initForms(): void {
    this.filtrosForm = this.fb.group({
      q: [''],
      idArticulo: [null],
      correoUsuario: [''],
      fechaCreacionDesde: [null],
      fechaCreacionHasta: [null],
      tipoMovimiento: [''],
      size: [9],
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    const filtros = this.obtenerFiltros();

    this.ajusteInventarioService.buscarPaginado(filtros, this.paginaActual(), this.obtenerTamano(), 'fechaCreacion,desc').subscribe({
      next: pagina => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el listado de ajustes de inventario');
        this.cargando.set(false);
      },
    });
  }

  buscar(): void {
    this.paginaActual.set(0);
    this.cargarLista();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      q: '',
      idArticulo: null,
      correoUsuario: '',
      fechaCreacionDesde: null,
      fechaCreacionHasta: null,
      tipoMovimiento: '',
      size: this.obtenerTamano(),
    });
    this.paginaActual.set(0);
    this.cargarLista();
  }

  cambiarTamano(): void {
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

  getArticuloNombre(idArticulo?: number): string {
    return this.articuloService.getNombreById(idArticulo ?? null);
  }

  private obtenerTamano(): number {
    return Number(this.filtrosForm.value.size) || 9;
  }

  private obtenerFiltros(): AjusteInventarioFiltro {
    const value = this.filtrosForm.value;
    const numero = (dato: unknown): number | undefined => dato === null || dato === '' ? undefined : Number(dato);

    return {
      q: value.q?.trim() || undefined,
      idArticulo: numero(value.idArticulo),
      correoUsuario: value.correoUsuario?.trim() || undefined,
      fechaCreacionDesde: value.fechaCreacionDesde || undefined,
      fechaCreacionHasta: value.fechaCreacionHasta || undefined,
      tipoMovimiento: value.tipoMovimiento?.trim() || undefined,
    };
  }
}
