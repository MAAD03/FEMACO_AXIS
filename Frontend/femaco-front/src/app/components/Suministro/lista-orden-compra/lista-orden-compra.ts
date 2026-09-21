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

  private readonly ESTADO_PENDIENTE = 1;
  private readonly ESTADO_COMPLETADO = 2;
  private readonly ESTADO_PARCIALMENTE_COMPLETADO = 3;
  private readonly ESTADO_CANCELADO = 4;

  private readonly ESTADOS_FINALES = [
    this.ESTADO_COMPLETADO,
    this.ESTADO_PARCIALMENTE_COMPLETADO,
    this.ESTADO_CANCELADO,
  ];

  // "Foto" del estado ORIGINAL (persistido en BD) de cada detalle al momento
  // de abrir la orden. Se usa solo para decidir si un combo debe bloquearse;
  // el valor que el usuario va seleccionando en pantalla (detallesOrden)
  // puede cambiar libremente sin que esto se actualice, así el combo no se
  // autodesactiva mientras editas. Solo se refresca al volver a abrir el
  // detalle (es decir, después de guardar).
  private detalleEstadosOriginales = new Map<number, number>();

  detalleForm!: FormGroup;
  ordenes = signal<OrdenCompra[]>([]);
  ordenesPendientes = signal<OrdenCompra[]>([]);
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
  tamanoPagina = signal<number>(6);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('orden-compra');
  }

  get puedeEditar(): boolean {
    return this.permisos.cambio;
  }

  get estadosDetalleDisponibles(): EstadoOrdenCompra[] {
    const estadoOrden = Number(this.ordenSeleccionada()?.idEstadoOrdenCompra ?? 0);
    const estadosBloqueados = estadoOrden === this.ESTADO_COMPLETADO ? [this.ESTADO_PARCIALMENTE_COMPLETADO] : [];

    return this.estadosOrdenCompra().filter(
      (estado) => !estadosBloqueados.includes(Number(estado.idEstadoOrdenCompra))
    );
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
        const ordenes = pagina.content ?? [];
        const totalPaginas = pagina.totalPages ?? 0;

        this.ordenes.set(ordenes);
        this.ordenesPendientes.set(
          ordenes.filter((orden) => Number(orden.idEstadoOrdenCompra ?? 0) === this.ESTADO_PENDIENTE)
        );
        this.totalPaginas.set(totalPaginas);
        this.totalElementos.set(pagina.totalElements ?? 0);

        const paginaValida = Math.min(Math.max(0, pagina.number ?? 0), Math.max(0, totalPaginas - 1));
        this.paginaActual.set(paginaValida);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las órdenes de compra');
        this.cargando.set(false);
      },
    });
  }

  private cargarListaPendientes(): void {
    this.ordenCompraService.buscarPaginado(0, 200, 'fechaCreacion', 'desc').subscribe({
      next: (pagina) => {
        const ordenes = pagina.content ?? [];
        this.ordenesPendientes.set(
          ordenes.filter((orden) => Number(orden.idEstadoOrdenCompra ?? 0) === this.ESTADO_PENDIENTE)
        );
      },
      error: () => {
        this.ordenesPendientes.set([]);
      },
    });
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) {
      return;
    }

    this.paginaActual.set(pagina);
    this.cargarLista();
  }

  cambiarTamanoPagina(nuevoTamano: number): void {
    if (!nuevoTamano || this.tamanoPagina() === nuevoTamano) {
      return;
    }

    this.tamanoPagina.set(nuevoTamano);
    this.paginaActual.set(0);
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

        // Guardamos la foto de los estados originales (persistidos) de cada
        // detalle. Es lo único contra lo que se valida el bloqueo.
        this.detalleEstadosOriginales = new Map(
          detalles
            .filter((detalle) => detalle.idOrdenCompraDetalle != null)
            .map((detalle) => [
              detalle.idOrdenCompraDetalle as number,
              Number(detalle.idEstadoOrdenCompra ?? 0),
            ])
        );

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
    this.detalleEstadosOriginales.clear();
    this.detalleForm.reset({ idEstadoOrdenCompra: null });
  }

  /**
   * True si el id de estado es un estado final: Completada, Parcialmente
   * completada o Cancelado.
   */
  esEstadoFinal(idEstado: number | null | undefined): boolean {
    return this.ESTADOS_FINALES.includes(Number(idEstado ?? 0));
  }

  /**
   * La orden se bloquea únicamente si YA VENÍA en un estado final desde el
   * backend (ordenSeleccionada no se actualiza mientras el usuario edita el
   * combo, así que esto nunca refleja una selección todavía no guardada).
   */
  ordenBloqueada(): boolean {
    return this.esEstadoFinal(this.ordenSeleccionada()?.idEstadoOrdenCompra);
  }

  /**
   * El combo de un detalle se bloquea únicamente si su estado ORIGINAL
   * (el que trajo el backend al abrir la orden) ya era final. Si el usuario
   * selecciona un estado final ahora mismo, el combo sigue habilitado hasta
   * que se guarde y se vuelva a cargar el detalle.
   */
  detalleBloqueado(detalle: OrdenCompraDetalle): boolean {
    const idDetalle = detalle.idOrdenCompraDetalle;
    const estadoOriginal =
      idDetalle != null ? this.detalleEstadosOriginales.get(idDetalle) : undefined;

    return this.esEstadoFinal(estadoOriginal);
  }

  actualizarEstadoDetalle(idDetalle: number | undefined, nuevoEstado: number | null): void {
    if (!idDetalle || this.ordenBloqueada()) {
      return;
    }

    const detalleActual = this.detallesOrden().find((detalle) => detalle.idOrdenCompraDetalle === idDetalle);
    if (detalleActual && this.detalleBloqueado(detalleActual)) {
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

    if (this.ordenBloqueada()) {
      this.error.set('La orden ya está en un estado final y no puede modificarse. Debe crear una nueva orden.');
      return;
    }

    const estadoOrdenAsignado = Number(this.detalleForm.value.idEstadoOrdenCompra ?? orden.idEstadoOrdenCompra ?? 0);
    const hayEstadosFinales =
      this.detallesOrden().some((detalle) => [this.ESTADO_COMPLETADO, this.ESTADO_CANCELADO].includes(Number(detalle.idEstadoOrdenCompra ?? 0))) ||
      [this.ESTADO_COMPLETADO, this.ESTADO_PARCIALMENTE_COMPLETADO, this.ESTADO_CANCELADO].includes(estadoOrdenAsignado);

    if (hayEstadosFinales) {
      const mensajeAdvertencia =
        'Está marcando un artículo como completado o cancelado o está cambiando la orden a Completada, Parcialmente completada o Cancelada. Este cambio ya no podrá editarse y deberá solicitar un ajuste de inventario o crear una nueva orden.';

      if (!window.confirm(`${mensajeAdvertencia} ¿Desea continuar?`)) {
        return;
      }
    }

    const confirmacion = window.confirm('¿Confirma que desea guardar los cambios de la orden y sus detalles?');
    if (!confirmacion) {
      return;
    }

    const dto: OrdenCompraUpdateRequest = {
      idOrdenCompra: orden.idOrdenCompra,
      idEstadoOrdenCompra: estadoOrdenAsignado,
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
        this.cerrarDetalle();
        this.cargarLista();
        this.cargarListaPendientes();
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
    return this.tamanoPagina();
  }
}