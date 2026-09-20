import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo, ArticuloFiltro } from '../../../core/models/articulo.model';
import { EstadoArticulo } from '../../../core/models/catalogo-models/estado-articulo.model';
import { Proveedor } from '../../../core/models/proveedor.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
import { EstadoArticuloNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-articulo-nombre-pipe';
import { ProveedorNombrePipe } from '../../../core/pipes/proveedor-nombre-pipe';
import { UnidadMedidaAbreviaturaPipe } from '../../../core/pipes/unidad-medida-abreviatura-pipe';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { EstadoArticuloService } from '../../../core/services/catalogo-services/estado-articulo.service';
import { OrdenCompraService } from '../../../core/services/orden-compra.service';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';
import { OrdenCompraCreateRequest } from '../../../core/models/orden-compra-detalle.model';

type OrdenCompraDetalleForm = {
  idArticulo: number;
  idAreaArticulo: number;
  idUnidadMedida: number;
  codigo?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
};

@Component({
  selector: 'app-orden-compra',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ProveedorNombrePipe,
    EstadoArticuloNombrePipe,
    AreaArticuloNombrePipe,
    UnidadMedidaAbreviaturaPipe,
  ],
  templateUrl: './orden-compra.html',
  styleUrl: './orden-compra.css',
})
export class OrdenCompra implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordenCompraService = inject(OrdenCompraService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly articuloService = inject(ArticuloService);
  private readonly estadoArticuloService = inject(EstadoArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  form!: FormGroup;
  filtrosForm!: FormGroup;

  proveedores = signal<Proveedor[]>([]);
  areas = signal<AreaArticuloModel[]>([]);
  unidades = signal<UnidadMedidaModel[]>([]);
  estadosArticulo = signal<EstadoArticulo[]>([]);
  articulos = signal<Articulo[]>([]);
  items = signal<OrdenCompraDetalleForm[]>([]);

  cargando = signal(false);
  buscandoArticulos = signal(false);
  mensaje = signal('');
  error = signal('');

  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];
  readonly estadoArticuloActivoId = signal<number | null>(null);

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('orden-compra');
  }

  get puedeCrear(): boolean {
    return this.permisos.alta;
  }

  get totalOrden(): number {
    return this.items().reduce((total, item) => total + Number(item.total || 0), 0);
  }

  ngOnInit(): void {
    this.initForms();
    this.cargarCatalogos();
    this.cargarLista();
  }

  private initForms(): void {
    this.form = this.fb.group({
      idProveedor: [null, [Validators.required]],
      notas: [''],
    });

    this.filtrosForm = this.fb.group({
      q: [''],
      idArea: [null],
      idUnidad: [null],
      stockMin: [null],
      stockMax: [null],
      precioMin: [null],
      precioMax: [null],
      stockBajo: [false],
      sinStock: [false],
      size: [9],
    });
  }

  private cargarCatalogos(): void {
    this.proveedorService.buscarTodos().subscribe({
      next: (data) => this.proveedores.set(data ?? []),
      error: () => this.error.set('Error al cargar los proveedores'),
    });

    this.areaArticuloService.buscarTodos().subscribe({
      next: (data) => this.areas.set(data ?? []),
      error: () => this.areas.set([]),
    });

    this.unidadMedidaService.buscarTodos().subscribe({
      next: (data) => this.unidades.set(data ?? []),
      error: () => this.unidades.set([]),
    });

    this.estadoArticuloService.buscarTodos().subscribe({
      next: (data) => {
        const estados = data ?? [];
        this.estadosArticulo.set(estados);

        const activo =
          estados.find((estado) => (estado.nombre ?? '').trim().toLowerCase() === 'activo') ??
          estados.find((estado) => /activo|habilitado|disponible/.test((estado.nombre ?? '').toLowerCase())) ??
          estados[0];

        this.estadoArticuloActivoId.set(activo?.idEstadoArticulo ?? null);
        this.cargarLista();
      },
      error: () => this.error.set('Error al cargar los estados de artículo'),
    });

    this.areaArticuloService.loadNombreCache().subscribe();
    this.unidadMedidaService.loadAbreviaturaCache().subscribe();
    this.proveedorService.loadNombreCache().subscribe();
    this.estadoArticuloService.loadNombreCache().subscribe();
  }

  buscarArticulos(): void {
    this.paginaActual.set(0);
    this.cargarLista();
  }

  private cargarLista(): void {
    const idEstado = this.estadoArticuloActivoId();
    const filtros = this.obtenerFiltros();
    filtros.idEstado = idEstado ?? undefined;

    this.buscandoArticulos.set(true);
    this.error.set('');

    this.articuloService.buscarPaginado(filtros, this.paginaActual(), this.obtenerTamano(), 'nombre,asc').subscribe({
      next: (pagina) => {
        this.articulos.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? this.paginaActual());
        this.buscandoArticulos.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los artículos activos');
        this.buscandoArticulos.set(false);
      },
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      q: '',
      idArea: null,
      idUnidad: null,
      stockMin: null,
      stockMax: null,
      precioMin: null,
      precioMax: null,
      stockBajo: false,
      sinStock: false,
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

  agregarArticulo(articulo: Articulo): void {
    if (!articulo.idArticulo) {
      return;
    }

    const existente = this.items().find((item) => item.idArticulo === articulo.idArticulo);
    if (existente) {
      this.actualizarCantidad(this.items().findIndex((item) => item.idArticulo === articulo.idArticulo), Number(existente.cantidad) + 1);
      return;
    }

    const precioUnitario = Number(articulo.precioCompraUltimoProveedor ?? 0);

    this.items.update((items) => [
      ...items,
      {
        idArticulo: articulo.idArticulo!,
        idAreaArticulo: articulo.idAreaArticulo ?? 0,
        idUnidadMedida: articulo.idUnidadMedida ?? 0,
        codigo: articulo.codigo,
        nombre: articulo.nombre,
        cantidad: 1,
        precioUnitario,
        total: precioUnitario,
      },
    ]);
  }

  actualizarCantidad(index: number, cantidad: number): void {
    if (index < 0) {
      return;
    }

    const valorNormalizado = Number.isFinite(cantidad) ? Math.max(0, Number(cantidad)) : 0;

    this.items.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const total = valorNormalizado * Number(item.precioUnitario || 0);

        return { ...item, cantidad: valorNormalizado, total };
      })
    );
  }

  actualizarPrecio(index: number, precio: number): void {
    if (index < 0) {
      return;
    }

    const valorNormalizado = Number.isFinite(precio) ? Math.max(0, Number(precio)) : 0;

    this.items.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const total = Number(item.cantidad || 0) * valorNormalizado;

        return { ...item, precioUnitario: valorNormalizado, total };
      })
    );
  }

  eliminarArticulo(index: number): void {
    this.items.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  onSubmit(): void {
    if (!this.puedeCrear) {
      this.error.set('No tienes permiso para crear órdenes de compra');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.items().length === 0) {
      this.error.set('Debes agregar al menos un artículo al carrito');
      return;
    }

    const usuarioId = this.authService.getCurrentUser()?.idUsuario;
    if (!usuarioId) {
      this.error.set('No se encontró el usuario autenticado');
      return;
    }

    const dto: OrdenCompraCreateRequest = {
      idProveedor: Number(this.form.value.idProveedor),
      notas: this.form.value.notas?.trim() || undefined,
      detalles: this.items().map((item) => ({
        idArticulo: item.idArticulo,
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precioUnitario),
      })),
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.ordenCompraService.crearConDetalles(dto).subscribe({
      next: () => {
        this.mensaje.set('Orden de compra creada correctamente');
        this.resetForm();
      },
      error: () => {
        this.error.set('Error al crear la orden de compra');
        this.cargando.set(false);
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      idProveedor: null,
      notas: '',
    });
    this.items.set([]);
    this.filtrosForm.reset({
      q: '',
      idArea: null,
      idUnidad: null,
      stockMin: null,
      stockMax: null,
      precioMin: null,
      precioMax: null,
      stockBajo: false,
      sinStock: false,
      size: 9,
    });
    this.cargando.set(false);
    this.paginaActual.set(0);
    this.cargarLista();
    setTimeout(() => this.mensaje.set(''), 3500);
  }

  private obtenerTamano(): number {
    return Number(this.filtrosForm.value.size) || 9;
  }

  private obtenerFiltros(): ArticuloFiltro {
    const value = this.filtrosForm.value;
    const numero = (dato: unknown): number | undefined => dato === null || dato === '' ? undefined : Number(dato);

    return {
      q: value.q?.trim() || undefined,
      idArea: numero(value.idArea),
      idUnidad: numero(value.idUnidad),
      stockMin: numero(value.stockMin),
      stockMax: numero(value.stockMax),
      precioMin: numero(value.precioMin),
      precioMax: numero(value.precioMax),
      stockBajo: value.stockBajo === true,
      sinStock: value.sinStock === true,
    };
  }

  get f() {
    return this.form.controls;
  }

  get qControl(): FormControl {
    return this.filtrosForm.get('q') as FormControl;
  }
}
