import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo, ArticuloFiltro } from '../../../core/models/articulo.model';
import { Cliente as ClienteModel } from '../../../core/models/cliente.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
import { UnidadMedidaAbreviaturaPipe } from '../../../core/pipes/unidad-medida-abreviatura-pipe';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';
import { VentaCreateRequest, VentaDetalleCreateRequest, VentaService } from '../../../core/services/venta.service';

interface VentaDetalleCarrito extends VentaDetalleCreateRequest {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  stockActual: number;
  precioUnitario: number;
  porcDescuentoMayorista: number;
  montoDescuentoMayorista: number;
  montoDescuentoManual: number;
  subtotalBruto: number;
  subtotal: number;
  cantidadMinimaDescuento: number;
  descuentoMayoristaArticulo: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AreaArticuloNombrePipe, UnidadMedidaAbreviaturaPipe],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly articuloService = inject(ArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly ventaService = inject(VentaService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  busquedaClienteForm: FormGroup = this.fb.group({
    nit: ['', [Validators.required, Validators.maxLength(45)]],
  });
  clienteSeleccionado = signal<ClienteModel | null>(null);
  idClienteSeleccionado = signal<number | null>(null);
  buscandoCliente = signal(false);
  errorCliente = signal('');
  filtrosForm!: FormGroup;
  articulos = signal<Articulo[]>([]);
  areas = signal<AreaArticuloModel[]>([]);
  unidades = signal<UnidadMedidaModel[]>([]);
  items = signal<VentaDetalleCarrito[]>([]);
  buscandoArticulos = signal(false);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  ventaCompletada = signal(false);
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  get permisos() { return this.conjuntoMenuService.getPermisosPorPagina('ventas'); }
  get puedeCrear(): boolean { return this.permisos.alta; }
  get puedeAplicarDescuento(): boolean {
    const usuario = this.authService.getCurrentUser() as (Record<string, unknown> | null);
    return usuario?.['PuedeAplicarDescuento'] === true;
  }

  get subtotal(): number { return this.items().reduce((total, item) => total + item.subtotalBruto, 0); }
  get descuentoMayoristaTotal(): number { return this.items().reduce((total, item) => total + item.montoDescuentoMayorista, 0); }
  get descuentoManualTotal(): number { return this.items().reduce((total, item) => total + item.montoDescuentoManual, 0); }
  get descuentoTotal(): number { return this.descuentoMayoristaTotal + this.descuentoManualTotal; }
  get total(): number { return this.subtotal - this.descuentoTotal; }
  get tamanoControl(): FormControl { return this.filtrosForm.get('size') as FormControl; }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      q: [''], idArea: [null], idUnidad: [null], stockMin: [null], stockMax: [null],
      precioMin: [null], precioMax: [null], stockBajo: [false], sinStock: [false], size: [9],
    });
    this.areaArticuloService.buscarTodos().subscribe({ next: data => this.areas.set(data ?? []) });
    this.unidadMedidaService.buscarTodos().subscribe({ next: data => this.unidades.set(data ?? []) });
    this.cargarLista();
  }

  buscarClientePorNit(): void {
    if (this.busquedaClienteForm.invalid) {
      this.busquedaClienteForm.markAllAsTouched();
      return;
    }

    this.buscandoCliente.set(true);
    this.errorCliente.set('');
    this.clienteSeleccionado.set(null);
    this.idClienteSeleccionado.set(null);

    const nit = this.busquedaClienteForm.value.nit?.trim();
    this.clienteService.buscarPorNit(nit).subscribe({
      next: (cliente) => {
        this.clienteSeleccionado.set(cliente);
        this.idClienteSeleccionado.set(cliente.idCliente ?? null);
        this.buscandoCliente.set(false);
      },
      error: () => {
        this.errorCliente.set('No se encontró un cliente con ese NIT');
        this.buscandoCliente.set(false);
      },
    });
  }

  limpiarCliente(): void {
    this.busquedaClienteForm.reset({ nit: '' });
    this.clienteSeleccionado.set(null);
    this.idClienteSeleccionado.set(null);
    this.errorCliente.set('');
  }

  buscarArticulos(): void { this.error.set(''); this.paginaActual.set(0); this.cargarLista(); }

  private cargarLista(): void {
    this.error.set('');
    this.buscandoArticulos.set(true);
    this.articuloService.buscarPaginado({ ...this.obtenerFiltros(), idEstado: 1 }, this.paginaActual(), this.obtenerTamano(), 'nombre,asc').subscribe({
      next: pagina => {
        this.error.set('');
        this.articulos.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? this.paginaActual());
        this.buscandoArticulos.set(false);
      },
      error: () => { this.error.set('Error al cargar los artículos activos'); this.buscandoArticulos.set(false); },
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({ q: '', idArea: null, idUnidad: null, stockMin: null, stockMax: null, precioMin: null, precioMax: null, stockBajo: false, sinStock: false, size: 9 });
    this.paginaActual.set(0);
    this.cargarLista();
  }

  cambiarTamano(): void { this.paginaActual.set(0); this.cargarLista(); }
  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas() && pagina !== this.paginaActual()) { this.paginaActual.set(pagina); this.cargarLista(); }
  }

  agregarArticulo(articulo: Articulo): void {
    if (articulo.idArticulo == null) return;
    const existente = this.items().findIndex(item => item.idArticulo === articulo.idArticulo);
    if (existente >= 0) { this.actualizarCantidad(existente, this.items()[existente].cantidad + 1); return; }
    this.items.update(items => [...items, this.crearDetalle(articulo)]);
  }

  private crearDetalle(articulo: Articulo): VentaDetalleCarrito {
    const precioCompra = Number(articulo.precioCompraUltimoProveedor ?? 0);
    const margen = Number(articulo.margenGanancia ?? 0);
    const precioUnitario = precioCompra + precioCompra * margen / 100;
    return this.recalcular({
      idArticulo: articulo.idArticulo!, codigo: articulo.codigo, nombre: articulo.nombre, descripcion: articulo.descripcion,
      stockActual: Number(articulo.stockActual ?? 0), cantidad: 1, precioUnitario, porcDescuentoManual: 0,
      porcDescuentoMayorista: 0, montoDescuentoMayorista: 0, montoDescuentoManual: 0, subtotalBruto: 0, subtotal: 0,
      cantidadMinimaDescuento: Number(articulo.cantidadMinimaDescuento ?? 0), descuentoMayoristaArticulo: Number(articulo.descuentoMayorista ?? 0),
    });
  }

  actualizarCantidad(index: number, cantidad: number): void { this.actualizarItem(index, { cantidad: this.normalizarNumero(cantidad) }); }
  actualizarDescuentoManual(index: number, descuento: number): void {
    this.actualizarItem(index, { porcDescuentoManual: this.puedeAplicarDescuento ? this.normalizarNumero(descuento) : 0 });
  }

  private actualizarItem(index: number, cambios: Partial<VentaDetalleCarrito>): void {
    this.items.update(items => items.map((item, itemIndex) => itemIndex === index ? this.recalcular({ ...item, ...cambios }) : item));
  }

  private recalcular(item: VentaDetalleCarrito): VentaDetalleCarrito {
    const cantidad = Math.max(0, Number(item.cantidad) || 0);
    const bruto = cantidad * (Number(item.precioUnitario) || 0);
    const aplicaMayorista = item.cantidadMinimaDescuento > 0 && cantidad >= item.cantidadMinimaDescuento;
    const porcMayorista = aplicaMayorista ? item.descuentoMayoristaArticulo : 0;
    const montoMayorista = bruto * porcMayorista / 100;
    const porcManual = this.puedeAplicarDescuento ? Math.min(100, Math.max(0, Number(item.porcDescuentoManual) || 0)) : 0;
    const montoManual = bruto * porcManual / 100;
    return { ...item, cantidad, porcDescuentoMayorista: porcMayorista, porcDescuentoManual: porcManual, subtotalBruto: bruto, montoDescuentoMayorista: montoMayorista, montoDescuentoManual: montoManual, subtotal: bruto - montoMayorista - montoManual };
  }

  eliminarArticulo(index: number): void { this.items.update(items => items.filter((_, itemIndex) => itemIndex !== index)); }

  onSubmit(): void {
    if (!this.puedeCrear) { this.error.set('No tienes permiso para crear ventas'); return; }
    const idCliente = this.idClienteSeleccionado();
    if (!idCliente) { this.error.set('Debes buscar y seleccionar un cliente'); return; }
    if (!this.items().length) { this.error.set('Debes agregar al menos un artículo al carrito'); return; }
    const dto: VentaCreateRequest = { idCliente, detalles: this.items().map(item => ({ idArticulo: item.idArticulo, cantidad: item.cantidad, porcDescuentoManual: item.porcDescuentoManual })) };
    this.cargando.set(true); this.error.set(''); this.mensaje.set('');
    this.ventaService.crearConDetalles(dto).subscribe({
      next: () => { this.mensaje.set('Venta creada correctamente'); this.ventaCompletada.set(true); this.cargando.set(false); },
      error: error => { this.error.set(error?.error?.message || error?.error?.mensaje || 'Error al crear la venta'); this.cargando.set(false); },
    });
  }

  cerrarVentaCompletada(): void {
    const confirmar = window.confirm('¿Está seguro de finalizar la venta? Se limpiará el formulario.');
    if (!confirmar) {
      return;
    }

    this.resetearCompra();
  }

  limpiarCompra(): void {
    const confirmar = window.confirm('¿Está seguro de limpiar la compra? Se perderán el cliente y los artículos seleccionados.');
    if (!confirmar) {
      return;
    }

    this.resetearCompra();
  }

  private resetearCompra(): void {
    this.ventaCompletada.set(false);
    this.mensaje.set('');
    this.error.set('');
    this.limpiarCliente();
    this.items.set([]);
    this.filtrosForm.reset({
      q: '', idArea: null, idUnidad: null, stockMin: null, stockMax: null,
      precioMin: null, precioMax: null, stockBajo: false, sinStock: false, size: 9,
    });
    this.paginaActual.set(0);
    this.cargarLista();
  }

  private obtenerFiltros(): ArticuloFiltro {
    const value = this.filtrosForm.value;
    const numero = (dato: unknown): number | undefined => dato === null || dato === '' ? undefined : Number(dato);
    return { q: value.q?.trim() || undefined, idArea: numero(value.idArea), idUnidad: numero(value.idUnidad), stockMin: numero(value.stockMin), stockMax: numero(value.stockMax), precioMin: numero(value.precioMin), precioMax: numero(value.precioMax), stockBajo: value.stockBajo === true, sinStock: value.sinStock === true };
  }

  private obtenerTamano(): number { return Number(this.filtrosForm.value.size) || 9; }
  private normalizarNumero(value: number): number { return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0; }

  get f() {
    return this.busquedaClienteForm.controls;
  }
}
