import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { EstadoOrdenCompraNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-orden-compra-nombre-pipe';
import { ProveedorNombrePipe } from '../../../core/pipes/proveedor-nombre-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { EstadoOrdenCompra } from '../../../core/models/catalogo-models/estado-orden-compra.model';
import { OrdenCompra } from '../../../core/models/orden-compra.model';
import { OrdenCompraDetalle, OrdenCompraUpdateRequest } from '../../../core/models/orden-compra-detalle.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { EstadoOrdenCompraService } from '../../../core/services/catalogo-services/estado-orden-compra.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { OrdenCompraService } from '../../../core/services/orden-compra.service';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-lista-orden-compra',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ProveedorNombrePipe,
    EstadoOrdenCompraNombrePipe,
    UsuariosEmailPipe,
    ArticuloNombrePipe,
  ],
  templateUrl: './lista-orden-compra.html',
  styleUrl: './lista-orden-compra.css',
})
export class ListaOrdenCompra implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordenCompraService = inject(OrdenCompraService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly articuloService = inject(ArticuloService);
  private readonly estadoOrdenCompraService = inject(EstadoOrdenCompraService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  detalleForm!: FormGroup;
  ordenes = signal<OrdenCompra[]>([]);
  estadosOrdenCompra = signal<EstadoOrdenCompra[]>([]);
  ordenSeleccionada = signal<OrdenCompra | null>(null);
  proveedorSeleccionado = signal<any | null>(null);
  usuarioCreacionSeleccionado = signal<any | null>(null);
  detallesOrden = signal<OrdenCompraDetalle[]>([]);

  cargando = signal(false);
  cargandoDetalle = signal(false);
  guardando = signal(false);
  error = signal('');

  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('orden-compra');
  }

  get puedeEditar(): boolean {
    return this.permisos.cambio;
  }

  ngOnInit(): void {
    this.initForms();
    this.cargarCatalogos();
    this.cargarLista();
  }

  private initForms(): void {
    this.detalleForm = this.fb.group({
      idEstadoOrdenCompra: [null],
    });
  }

  private cargarCatalogos(): void {
    this.proveedorService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
    this.articuloService.loadNombreCache().subscribe();
    this.estadoOrdenCompraService.loadNombreCache().subscribe();

    this.estadoOrdenCompraService.buscarTodos().subscribe({
      next: (data) => this.estadosOrdenCompra.set(data ?? []),
      error: () => this.estadosOrdenCompra.set([]),
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    this.ordenCompraService.buscarPaginado(this.paginaActual(), this.obtenerTamano(), 'fechaCreacion', 'desc').subscribe({
      next: (pagina) => {
        this.ordenes.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las órdenes de compra');
        this.cargando.set(false);
      },
    });
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

  verDetalles(idOrdenCompra: number): void {
    if (!idOrdenCompra) {
      return;
    }

    this.cargandoDetalle.set(true);
    this.error.set('');

    this.ordenCompraService.buscarPorId(idOrdenCompra).subscribe({
      next: (respuesta) => {
        const orden = respuesta?.ordenCompra ?? null;
        const detalles = this.normalizarDetalles(respuesta);

        this.ordenSeleccionada.set(orden as OrdenCompra);
        this.proveedorSeleccionado.set(respuesta?.proveedor ?? null);
        this.usuarioCreacionSeleccionado.set(respuesta?.usuarioCreacion ?? null);
        this.detallesOrden.set(detalles);
        this.detalleForm.reset({
          idEstadoOrdenCompra: orden?.idEstadoOrdenCompra ?? null,
        });
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la información de la orden seleccionada');
        this.cargandoDetalle.set(false);
      },
    });
  }

  cerrarDetalle(): void {
    this.ordenSeleccionada.set(null);
    this.proveedorSeleccionado.set(null);
    this.usuarioCreacionSeleccionado.set(null);
    this.detallesOrden.set([]);
    this.detalleForm.reset({ idEstadoOrdenCompra: null });
  }

  actualizarEstadoDetalle(idDetalle: number | undefined, nuevoEstado: number | null): void {
    if (!idDetalle) {
      return;
    }

    this.detallesOrden.update((detalles) =>
      detalles.map((detalle) =>
        detalle.idOrdenCompraDetalle === idDetalle
          ? { ...detalle, idEstadoOrdenCompra: nuevoEstado ?? detalle.idEstadoOrdenCompra }
          : detalle
      )
    );
  }

  guardarCambios(): void {
    const orden = this.ordenSeleccionada();
    if (!orden?.idOrdenCompra || !this.puedeEditar) {
      this.error.set('No tienes permisos para modificar los estados de la orden');
      return;
    }

    const dto: OrdenCompraUpdateRequest = {
      idOrdenCompra: orden.idOrdenCompra,
      idEstadoOrdenCompra: Number(this.detalleForm.value.idEstadoOrdenCompra ?? orden.idEstadoOrdenCompra ?? 0),
      notas: orden.notas?.trim() || undefined,
      detalles: this.detallesOrden().map((detalle) => ({
        idOrdenCompraDetalle: detalle.idOrdenCompraDetalle ?? 0,
        cantidad: Number(detalle.cantidad ?? 0),
        precioUnitario: Number(detalle.precioUnitario ?? 0),
        idEstadoOrdenCompra: Number(detalle.idEstadoOrdenCompra ?? 0),
      })),
    };

    this.guardando.set(true);
    this.error.set('');

    this.ordenCompraService.actualizarConDetalles(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.verDetalles(orden.idOrdenCompra!);
      },
      error: () => {
        this.error.set('Error al actualizar los estados de la orden y sus detalles');
        this.guardando.set(false);
      },
    });
  }

  private normalizarDetalles(respuesta: any): OrdenCompraDetalle[] {
    const rawDetalles =
      respuesta?.detalles ??
      respuesta?.ordenCompra?.detalles ??
      respuesta?.ordenCompraDetalles ??
      respuesta?.ordenCompraDetalle ??
      respuesta?.detalle ??
      [];

    return Array.isArray(rawDetalles) ? (rawDetalles as OrdenCompraDetalle[]) : [];
  }

  private obtenerTamano(): number {
    return 9;
  }
}
