import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EstadoVenta } from '../../../core/models/catalogo-models/estado-venta.model';
import { Venta, VentaFiltro } from '../../../core/models/venta.model';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { ClieneNitPipe } from '../../../core/pipes/cliene-nit-pipe';
import { ClienteNombrePipe } from '../../../core/pipes/cliente-nombre-pipe';
import { EstadoVentaNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-venta-nombre-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { EstadoVentaService } from '../../../core/services/catalogo-services/estado-venta.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { VentaConDetalles, VentaService } from '../../../core/services/venta.service';

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ArticuloNombrePipe, ClieneNitPipe, ClienteNombrePipe, EstadoVentaNombrePipe, UsuariosEmailPipe],
  templateUrl: './lista-ventas.html',
  styleUrl: './lista-ventas.css',
})
export class ListaVentas implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly estadoVentaService = inject(EstadoVentaService);
  private readonly articuloService = inject(ArticuloService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  filtrosForm!: FormGroup;
  lista = signal<Venta[]>([]);
  estados = signal<EstadoVenta[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  ventaSeleccionada = signal<VentaConDetalles | null>(null);
  cargandoDetalle = signal(false);
  errorDetalle = signal('');
  anulando = signal(false);

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('ventas');
  }

  get puedeAnular(): boolean {
    return this.permisos.baja;
  }

  ngOnInit(): void {
    this.initForms();
    this.estadoVentaService.buscarTodos().subscribe({ next: data => this.estados.set(data ?? []) });
    this.clienteService.loadNombreCache().subscribe();
    this.estadoVentaService.loadNombreCache().subscribe();
    this.articuloService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
    this.cargarLista();
  }

  private initForms(): void {
    this.filtrosForm = this.fb.group({
      fechaCreacionDesde: [null],
      fechaCreacionHasta: [null],
      nitCliente: [''],
      numeroFactura: [''],
      idEstadoVenta: [null],
      correoUsuario: [''],
      size: [9],
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    const filtros = this.obtenerFiltros();

    this.ventaService.buscarPaginado(filtros, this.paginaActual(), this.obtenerTamano(), 'fechaCreacion', 'desc').subscribe({
      next: pagina => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las ventas');
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
      fechaCreacionDesde: null,
      fechaCreacionHasta: null,
      nitCliente: '',
      numeroFactura: '',
      idEstadoVenta: null,
      correoUsuario: '',
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
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarLista();
  }

  verDetalle(idVenta?: number): void {
    if (idVenta == null) return;
    this.cargandoDetalle.set(true);
    this.errorDetalle.set('');
    this.ventaService.buscarPorId(idVenta).subscribe({
      next: detalle => {
        this.ventaSeleccionada.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.errorDetalle.set('Error al cargar el detalle de la venta');
        this.cargandoDetalle.set(false);
      },
    });
  }

  cerrarDetalle(): void {
    this.ventaSeleccionada.set(null);
    this.errorDetalle.set('');
  }

  anularVenta(): void {
    const venta = this.ventaSeleccionada()?.venta;
    if (!venta?.idVenta || !this.puedeAnular) return;

    const confirmado = window.confirm(
      '¿Está seguro que desea anular esta venta? Esta acción no se podrá modificar después.'
    );
    if (!confirmado) return;

    this.anulando.set(true);
    this.errorDetalle.set('');

    this.ventaService.anular(venta.idVenta).subscribe({
      next: () => {
        this.mensaje.set('Venta anulada correctamente');
        this.anulando.set(false);
        this.verDetalle(venta.idVenta);
        this.cargarLista();
        setTimeout(() => this.mensaje.set(''), 3500);
      },
      error: () => {
        this.errorDetalle.set('Error al anular la venta');
        this.anulando.set(false);
      },
    });
  }

  private obtenerTamano(): number {
    return Number(this.filtrosForm.value.size) || 9;
  }

  private obtenerFiltros(): VentaFiltro {
    const value = this.filtrosForm.value;
    const numero = (dato: unknown): number | undefined => dato === null || dato === '' ? undefined : Number(dato);

    return {
      fechaCreacionDesde: value.fechaCreacionDesde || undefined,
      fechaCreacionHasta: value.fechaCreacionHasta || undefined,
      nitCliente: value.nitCliente?.trim() || undefined,
      numeroFactura: value.numeroFactura?.trim() || undefined,
      idEstadoVenta: numero(value.idEstadoVenta),
      correoUsuario: value.correoUsuario?.trim() || undefined,
    };
  }
}
