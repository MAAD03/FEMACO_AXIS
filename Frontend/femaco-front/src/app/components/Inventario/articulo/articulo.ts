import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo as ArticuloModel, ArticuloFiltro } from '../../../core/models/articulo.model';
import { EstadoArticulo } from '../../../core/models/catalogo-models/estado-articulo.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
import { EstadoArticuloNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-articulo-nombre-pipe';
import { UnidadMedidaAbreviaturaPipe } from '../../../core/pipes/unidad-medida-abreviatura-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { EstadoArticuloService } from '../../../core/services/catalogo-services/estado-articulo.service';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-articulo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AreaArticuloNombrePipe,
    EstadoArticuloNombrePipe,
    UnidadMedidaAbreviaturaPipe,
    UsuariosEmailPipe,
  ],
  templateUrl: './articulo.html',
  styleUrl: './articulo.css',
})
export class Articulo implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly articuloService = inject(ArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly estadoArticuloService = inject(EstadoArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);
  private readonly usuarioService = inject(UsuarioService);

  form!: FormGroup;
  filtrosForm!: FormGroup;
  lista = signal<ArticuloModel[]>([]);
  areas = signal<AreaArticuloModel[]>([]);
  unidades = signal<UnidadMedidaModel[]>([]);
  estados = signal<EstadoArticulo[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  editando = false;
  idEditando: number | null = null;
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('articulo');
  }

  get puedeCrear(): boolean { return this.permisos.alta; }
  get puedeEditar(): boolean { return this.permisos.cambio; }
  get puedeEliminar(): boolean { return this.permisos.baja; }

  ngOnInit(): void {
    this.initForms();
    this.cargarCatalogos();
    this.cargarLista();
    this.usuarioService.loadEmailCache().subscribe();
  }

  private initForms(): void {
    this.form = this.fb.group({
      codigo: ['', Validators.maxLength(50)],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: ['', Validators.maxLength(5000)],
      stockMinimo: [0, [Validators.min(0)]],
      precioCompraUltimoProveedor: [null, Validators.min(0)],
      margenGanancia: [null, [Validators.min(0), Validators.max(100)]],
      cantidadMinimaDescuento: [null, Validators.min(0)],
      descuentoMayorista: [null, [Validators.min(0), Validators.max(100)]],
      idAreaArticulo: [null, Validators.required],
      idUnidadMedida: [null, Validators.required],
      idEstadoArticulo: [null, Validators.required],
    });
    this.filtrosForm = this.fb.group({
      q: [''],
      idArea: [null],
      idUnidad: [null],
      idEstado: [null],
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
    this.areaArticuloService.buscarTodos().subscribe({ next: data => this.areas.set(data ?? []) });
    this.unidadMedidaService.buscarTodos().subscribe({ next: data => this.unidades.set(data ?? []) });
    this.estadoArticuloService.buscarTodos().subscribe({ next: data => this.estados.set(data ?? []) });
    this.areaArticuloService.loadNombreCache().subscribe();
    this.estadoArticuloService.loadNombreCache().subscribe();
    this.unidadMedidaService.loadAbreviaturaCache().subscribe();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');
    const filtros = this.obtenerFiltros();
    this.articuloService.buscarPaginado(filtros, this.paginaActual(), this.obtenerTamano(), 'nombre,asc').subscribe({
      next: pagina => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los artículos');
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
      idArea: null,
      idUnidad: null,
      idEstado: null,
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
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarLista();
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
      idEstado: numero(value.idEstado),
      stockMin: numero(value.stockMin),
      stockMax: numero(value.stockMax),
      precioMin: numero(value.precioMin),
      precioMax: numero(value.precioMax),
      stockBajo: value.stockBajo === true,
      sinStock: value.sinStock === true,
    };
  }

  private finalizarOperacion(mensaje: string): void {
    this.mensaje.set(mensaje);
    this.resetForm();
    this.cargarLista();
    setTimeout(() => this.mensaje.set(''), 3500);
  }

  onSubmit(): void {
    if ((this.editando && !this.puedeEditar) || (!this.editando && !this.puedeCrear)) {
      this.error.set(this.editando ? 'No tienes permiso para modificar' : 'No tienes permiso para crear');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const usuarioId = this.authService.getCurrentUser()?.idUsuario;
    if (!usuarioId) {
      this.error.set('No se encontró el usuario autenticado');
      return;
    }
    const value = this.form.value;
    const datos: ArticuloModel = {
      codigo: value.codigo?.trim() || undefined,
      nombre: value.nombre.trim(),
      descripcion: value.descripcion?.trim() || undefined,
      stockMinimo: this.numeroOpcional(value.stockMinimo),
      precioCompraUltimoProveedor: this.numeroOpcional(value.precioCompraUltimoProveedor),
      margenGanancia: this.numeroOpcional(value.margenGanancia),
      cantidadMinimaDescuento: this.numeroOpcional(value.cantidadMinimaDescuento),
      descuentoMayorista: this.numeroOpcional(value.descuentoMayorista),
      idAreaArticulo: Number(value.idAreaArticulo),
      idUnidadMedida: Number(value.idUnidadMedida),
      idEstadoArticulo: Number(value.idEstadoArticulo),
      usuarioCreacion: usuarioId,
    };
    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');
    if (this.editando && this.idEditando) {
      datos.usuarioModif = usuarioId;
      this.articuloService.actualizar(this.idEditando, datos).subscribe({
        next: () => this.finalizarOperacion('Artículo actualizado correctamente'),
        error: () => { this.error.set('Error al actualizar el artículo'); this.cargando.set(false); },
      });
    } else {
      this.articuloService.crear(datos).subscribe({
        next: () => this.finalizarOperacion('Artículo creado correctamente'),
        error: () => { this.error.set('Error al crear el artículo'); this.cargando.set(false); },
      });
    }
  }

  private numeroOpcional(value: unknown): number | undefined {
    return value === null || value === '' ? undefined : Number(value);
  }

  precioFinalFormulario(): number | null {
    const precioCompra = this.numeroOpcional(this.form?.value.precioCompraUltimoProveedor);
    const margen = this.numeroOpcional(this.form?.value.margenGanancia);
    return this.calcularPrecioFinal(precioCompra, margen);
  }

  precioFinal(item: ArticuloModel): number | null {
    return this.calcularPrecioFinal(item.precioCompraUltimoProveedor, item.margenGanancia);
  }

  private calcularPrecioFinal(precioCompra: number | undefined, margen: number | undefined): number | null {
    if (precioCompra === undefined || margen === undefined) return null;
    return precioCompra * (1 + margen / 100);
  }

  editar(item: ArticuloModel): void {
    if (!this.puedeEditar) return;
    this.editando = true;
    this.idEditando = item.idArticulo!;
    this.form.patchValue(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number): void {
    if (!this.puedeEliminar || !confirm('¿Está seguro de eliminar este artículo?')) return;
    this.cargando.set(true);
    this.articuloService.eliminar(id).subscribe({
      next: () => this.finalizarOperacion('Artículo eliminado correctamente'),
      error: () => { this.error.set('Error al eliminar el artículo'); this.cargando.set(false); },
    });
  }

  cancelar(): void { this.resetForm(); }

  private resetForm(): void {
    this.form.reset({ stockMinimo: 0 });
    this.editando = false;
    this.idEditando = null;
    this.cargando.set(false);
  }

  get f() { return this.form.controls; }
}
