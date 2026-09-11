import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo as ArticuloModel, ArticuloFiltro } from '../../../core/models/articulo.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
import { EstadoArticuloNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-articulo-nombre-pipe';
import { UnidadMedidaAbreviaturaPipe } from '../../../core/pipes/unidad-medida-abreviatura-pipe';
import { AjusteInventarioCreateRequest } from '../../../core/models/ajuste-inventario.model';
import { AjusteInventarioService } from '../../../core/services/ajuste-invetario.service';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';

@Component({
  selector: 'app-ajuste-inventario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AreaArticuloNombrePipe,
    EstadoArticuloNombrePipe,
    UnidadMedidaAbreviaturaPipe,
  ],
  templateUrl: './ajuste-inventario.html',
  styleUrl: './ajuste-inventario.css',
})
export class AjusteInventario implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ajusteInventarioService = inject(AjusteInventarioService);
  private readonly articuloService = inject(ArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  form!: FormGroup;
  filtrosForm!: FormGroup;
  lista = signal<ArticuloModel[]>([]);
  areas = signal<AreaArticuloModel[]>([]);
  unidades = signal<UnidadMedidaModel[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  articuloSeleccionado = signal<ArticuloModel | null>(null);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('ajuste-inventario');
  }

  get puedeCrear(): boolean {
    return this.permisos.alta;
  }

  ngOnInit(): void {
    this.initForms();
    this.cargarCatalogos();
    this.cargarLista();
  }

  private initForms(): void {
    this.form = this.fb.group({
      cantidadAjuste: [null, [Validators.required, Validators.min(0.01)]],
      motivo: ['', Validators.maxLength(1000)],
      idArticulo: [null, Validators.required],
      tipoAjuste: ['agregar', Validators.required],
    });

    this.form.valueChanges.subscribe(() => this.validarCantidadAjuste());

    this.filtrosForm = this.fb.group({
      q: [''],
      idArea: [null],
      idUnidad: [null],
      stockMin: [null],
      stockMax: [null],
      size: [9],
    });
  }

  private cargarCatalogos(): void {
    this.areaArticuloService.buscarTodos().subscribe({
      next: data => this.areas.set(data ?? []),
      error: () => this.areas.set([]),
    });

    this.unidadMedidaService.buscarTodos().subscribe({
      next: data => this.unidades.set(data ?? []),
      error: () => this.unidades.set([]),
    });

    this.areaArticuloService.loadNombreCache().subscribe();
    this.unidadMedidaService.loadAbreviaturaCache().subscribe();
    this.articuloService.loadNombreCache().subscribe();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    const filtros = this.obtenerFiltros();
    filtros.idEstado = 1;

    this.articuloService.buscarPaginado(filtros, this.paginaActual(), this.obtenerTamano(), 'nombre,asc').subscribe({
      next: pagina => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los artículos activos');
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
      stockMin: null,
      stockMax: null,
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

  seleccionarArticulo(item: ArticuloModel): void {
    this.articuloSeleccionado.set(item);
    this.form.patchValue({ idArticulo: item.idArticulo });
    this.validarCantidadAjuste();
    this.error.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(): void {
    if (!this.puedeCrear) {
      this.error.set('No tienes permiso para crear ajustes de inventario');
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

    const value = this.form.getRawValue();

    const dto: AjusteInventarioCreateRequest = {
      cantidad: Number(value.cantidadAjuste),
      motivo: value.motivo?.trim() || undefined,
      idArticulo: Number(value.idArticulo),
      agregar: value.tipoAjuste === 'agregar',
      quitar: value.tipoAjuste === 'quitar',
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.ajusteInventarioService.crear(dto).subscribe({
      next: () => {
        this.mensaje.set('Ajuste de inventario creado correctamente');
        this.resetForm();
        this.cargarLista();
        setTimeout(() => this.mensaje.set(''), 3500);
      },
      error: () => {
        this.error.set('Error al crear el ajuste de inventario');
        this.cargando.set(false);
      },
    });
  }

  cancelar(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset({
      cantidadAjuste: null,
      motivo: '',
      idArticulo: null,
      tipoAjuste: 'agregar',
    });
    this.articuloSeleccionado.set(null);
    this.cargando.set(false);
  }

  private validarCantidadAjuste(): void {
    const cantidadCtrl = this.form.get('cantidadAjuste');
    const tipoAjuste = this.form.get('tipoAjuste')?.value;
    const articulo = this.articuloSeleccionado();

    if (!cantidadCtrl) {
      return;
    }

    const errores = { ...(cantidadCtrl.errors ?? {}) };
    delete errores['stockInsuficiente'];

    const value = cantidadCtrl.value;
    const cantidad = Number(value);

    if (value === null || value === '' || Number.isNaN(cantidad)) {
      cantidadCtrl.setErrors(Object.keys(errores).length > 0 ? errores : null);
      return;
    }

    if (tipoAjuste === 'quitar' && articulo?.stockActual != null) {
      const stockActual = Number(articulo.stockActual ?? 0);
      if (cantidad > stockActual) {
        errores['stockInsuficiente'] = true;
        cantidadCtrl.setErrors(errores);
        return;
      }
    }

    cantidadCtrl.setErrors(Object.keys(errores).length > 0 ? errores : null);
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
    };
  }

  get f() {
    return this.form.controls;
  }
}
