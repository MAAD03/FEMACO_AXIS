import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo, ArticuloFiltro } from '../../../core/models/articulo.model';
import { Cliente as ClienteModel } from '../../../core/models/cliente.model';
import { CotizacionCreateRequest } from '../../../core/models/cotizacion.model';
import { Pedido } from '../../../core/models/pedido.model';
import { MetodoPago } from '../../../core/models/venta.model';
import { VentaDetalle } from '../../../core/models/venta-detalle.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { UnidadMedidaAbreviaturaPipe } from '../../../core/pipes/unidad-medida-abreviatura-pipe';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { PedidoService } from '../../../core/services/pedido.service';
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

interface DetallePedidoEditable {
  detalle: VentaDetalle;
  cantidad: number;
}

interface Decimal {
  coefficient: bigint;
  scale: number;
}

function powerOfTen(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

function decimal(value: number): Decimal {
  const text = Number.isFinite(value) ? String(value) : '0';
  const match = text.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match) return { coefficient: 0n, scale: 0 };

  const fraction = match[3] ?? '';
  const exponent = Number(match[4] ?? 0);
  let coefficient = BigInt(`${match[1]}${match[2]}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= powerOfTen(-scale);
    scale = 0;
  }
  return { coefficient, scale };
}

function addDecimals(left: Decimal, right: Decimal): Decimal {
  const scale = Math.max(left.scale, right.scale);
  return {
    coefficient: left.coefficient * powerOfTen(scale - left.scale)
      + right.coefficient * powerOfTen(scale - right.scale),
    scale,
  };
}

function multiplyDecimals(left: Decimal, right: Decimal): Decimal {
  return { coefficient: left.coefficient * right.coefficient, scale: left.scale + right.scale };
}

function divideDecimalByHundred(value: Decimal): Decimal {
  return { coefficient: value.coefficient, scale: value.scale + 2 };
}

function roundHalfUpToCents(value: Decimal): bigint {
  const scaled = value.coefficient * 100n;
  const divisor = powerOfTen(value.scale);
  const quotient = scaled / divisor;
  const remainder = scaled % divisor;
  if (remainder === 0n || (remainder < 0n ? -remainder : remainder) * 2n < divisor) return quotient;
  return quotient + (scaled < 0n ? -1n : 1n);
}

function roundUpToNickel(cents: bigint): bigint {
  const remainder = cents % 5n;
  if (remainder === 0n) return cents;
  return cents >= 0n ? cents + (5n - remainder) : cents - remainder;
}

function roundMoney(value: Decimal): number {
  return Number(roundUpToNickel(roundHalfUpToCents(value))) / 100;
}

function moneyCents(value: number): bigint {
  return roundHalfUpToCents(decimal(value));
}

function sumMoney(values: number[]): number {
  return Number(values.reduce((sum, value) => sum + moneyCents(value), 0n)) / 100;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AreaArticuloNombrePipe, ArticuloNombrePipe, UnidadMedidaAbreviaturaPipe],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly cotizacionService = inject(CotizacionService);
  private readonly pedidoService = inject(PedidoService);
  private readonly articuloService = inject(ArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly ventaService = inject(VentaService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  busquedaClienteForm: FormGroup = this.fb.group({
    nit: ['', [Validators.required, Validators.maxLength(45)]],
  });
  cotizacionForm: FormGroup = this.fb.group({
    nit: ['', [Validators.required, Validators.maxLength(45)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
  });
  pedidoForm: FormGroup = this.fb.group({
    idVenta: [{ value: null, disabled: true }, [Validators.required]],
    fechaEntrega: [''],
    direccionEntrega: ['', [Validators.required, Validators.maxLength(1000)]],
    notasEntrega: ['', Validators.maxLength(1000)],
    numeroEntrega: ['', [Validators.required, Validators.maxLength(50)]],
    productoDePedido: [{ value: '', disabled: true }],
  });
  pagoForm = this.fb.group({
    metodoPago: this.fb.control<MetodoPago | null>(null, Validators.required),
    referenciaPago: this.fb.control('', Validators.maxLength(45)),
  });
  mostrandoFormularioCotizacion = signal(false);
  mostrandoFormularioPedido = signal(false);
  mostrandoFormularioPago = signal(false);
  creandoPedido = signal(false);
  registrandoPago = signal(false);
  pagoRegistrado = signal(false);
  pedidoCreado = signal(false);
  detallesPedido = signal<DetallePedidoEditable[]>([]);
  cargandoDetallesPedido = signal(false);
  errorPedido = signal('');
  mensajePedido = signal('');
  errorPago = signal('');
  mensajePago = signal('');
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
  idVentaCompletada = signal<number | null>(null);
  totalVentaCompletada = signal<number | null>(null);
  generandoComprobante = signal(false);
  errorComprobante = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];
  readonly metodosPago: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'CHEQUE', 'TRANSFERENCIA', 'DEPOSITO'];

  get permisos() { return this.conjuntoMenuService.getPermisosPorPagina('ventas'); }
  get puedeCrear(): boolean { return this.permisos.alta; }
  get permisosCotizacion() { return this.conjuntoMenuService.getPermisosPorPagina('cotizacion'); }
  get puedeCrearCotizacion(): boolean { return this.permisosCotizacion.alta; }
  get permisosPedido() { return this.conjuntoMenuService.getPermisosPorPagina('pedidos'); }
  get puedeCrearPedido(): boolean { return this.permisosPedido.alta; }
  get fechaMinimaEntrega(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }
  get puedeAplicarDescuento(): boolean {
    const usuario = this.authService.getCurrentUser() as (Record<string, unknown> | null);
    return usuario?.['PuedeAplicarDescuento'] === true;
  }

  get subtotal(): number { return sumMoney(this.items().map(item => item.subtotalBruto)); }
  get descuentoMayoristaTotal(): number { return sumMoney(this.items().map(item => item.montoDescuentoMayorista)); }
  get descuentoManualTotal(): number { return sumMoney(this.items().map(item => item.montoDescuentoManual)); }
  get descuentoTotal(): number { return sumMoney([this.descuentoMayoristaTotal, this.descuentoManualTotal]); }
  get total(): number { return sumMoney(this.items().map(item => item.subtotal)); }
  get tamanoControl(): FormControl { return this.filtrosForm.get('size') as FormControl; }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      q: [''], idArea: [null], idUnidad: [null], stockMin: [null], stockMax: [null],
      precioMin: [null], precioMax: [null], stockBajo: [false], sinStock: [false], size: [9],
    });
    this.areaArticuloService.buscarTodos().subscribe({ next: data => this.areas.set(data ?? []) });
    this.unidadMedidaService.buscarTodos().subscribe({ next: data => this.unidades.set(data ?? []) });
    this.articuloService.loadNombreCache().subscribe();
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
    const precioUnitario = this.calcularPrecioVenta(precioCompra, margen);
    return this.recalcular({
      idArticulo: articulo.idArticulo!, codigo: articulo.codigo, nombre: articulo.nombre, descripcion: articulo.descripcion,
      stockActual: Number(articulo.stockActual ?? 0), cantidad: 1, precioUnitario, porcDescuentoManual: 0,
      porcDescuentoMayorista: 0, montoDescuentoMayorista: 0, montoDescuentoManual: 0, subtotalBruto: 0, subtotal: 0,
      cantidadMinimaDescuento: Number(articulo.cantidadMinimaDescuento ?? 0), descuentoMayoristaArticulo: Number(articulo.descuentoMayorista ?? 0),
    });
  }

  actualizarCantidad(index: number, cantidad: number): void { this.actualizarItem(index, { cantidad: this.normalizarNumero(cantidad) }); }
  limitarDescuentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = Number(input.value);
    if (Number.isFinite(valor) && valor > 100) input.value = '100';
  }

  actualizarDescuentoManual(index: number, descuento: number): void {
    this.actualizarItem(index, { porcDescuentoManual: this.puedeAplicarDescuento ? this.normalizarDescuento(descuento) : 0 });
  }

  private actualizarItem(index: number, cambios: Partial<VentaDetalleCarrito>): void {
    this.items.update(items => items.map((item, itemIndex) => itemIndex === index ? this.recalcular({ ...item, ...cambios }) : item));
  }

  private recalcular(item: VentaDetalleCarrito): VentaDetalleCarrito {
    const cantidad = Math.max(0, Number(item.cantidad) || 0);
    const precioUnitario = this.calcularPrecioVenta(Number(item.precioUnitario) || 0, 0);
    const bruto = roundMoney(multiplyDecimals(decimal(cantidad), decimal(precioUnitario)));
    const aplicaMayorista = item.cantidadMinimaDescuento > 0 && cantidad >= item.cantidadMinimaDescuento;
    const porcMayorista = aplicaMayorista ? Math.min(100, Math.max(0, Number(item.descuentoMayoristaArticulo) || 0)) : 0;
    const montoMayorista = roundMoney(multiplyDecimals(decimal(bruto), divideDecimalByHundred(decimal(porcMayorista))));
    const porcManualMaximo = 100 - porcMayorista;
    const porcManual = this.puedeAplicarDescuento
      ? Math.min(porcManualMaximo, Math.max(0, Number(item.porcDescuentoManual) || 0))
      : 0;
    const montoManual = roundMoney(multiplyDecimals(decimal(bruto), divideDecimalByHundred(decimal(porcManual))));
    const subtotalCents = moneyCents(bruto) - moneyCents(montoMayorista) - moneyCents(montoManual);
    const subtotal = Number(roundUpToNickel(subtotalCents)) / 100;
    return { ...item, cantidad, precioUnitario, porcDescuentoMayorista: porcMayorista, porcDescuentoManual: porcManual, subtotalBruto: bruto, montoDescuentoMayorista: montoMayorista, montoDescuentoManual: montoManual, subtotal };
  }

  calcularPrecioVenta(precioCompra: number, margen: number): number {
    const costo = decimal(precioCompra);
    const incremento = divideDecimalByHundred(multiplyDecimals(costo, decimal(margen)));
    return roundMoney(addDecimals(costo, incremento));
  }

  eliminarArticulo(index: number): void { this.items.update(items => items.filter((_, itemIndex) => itemIndex !== index)); }

  onSubmit(): void {
    if (!this.puedeCrear) { this.error.set('No tienes permiso para crear ventas'); return; }
    const idCliente = this.idClienteSeleccionado();
    if (!idCliente) { this.error.set('Debes buscar y seleccionar un cliente'); return; }
    if (!this.items().length) { this.error.set('Debes agregar al menos un artículo al carrito'); return; }
    if (this.items().some(item => item.subtotal < 0)) { this.error.set('Los descuentos no pueden ser mayores que el subtotal'); return; }
    if (!window.confirm('¿Desea crear la venta con el cliente y los artículos seleccionados?')) return;
    const dto: VentaCreateRequest = { idCliente, detalles: this.items().map(item => ({ idArticulo: item.idArticulo, cantidad: item.cantidad, porcDescuentoManual: item.porcDescuentoManual })) };
    this.cargando.set(true); this.error.set(''); this.mensaje.set('');
    this.ventaService.crearConDetalles(dto).subscribe({
      next: venta => {
        this.mensaje.set('Venta creada correctamente');
        this.idVentaCompletada.set(venta.idVenta ?? null);
        this.totalVentaCompletada.set(venta.total ?? this.total);
        this.ventaCompletada.set(true);
        this.cargando.set(false);
      },
      error: error => { this.error.set(error?.error?.message || error?.error?.mensaje || 'Error al crear la venta'); this.cargando.set(false); },
    });
  }

  abrirFormularioPago(): void {
    if (this.idVentaCompletada() == null) return;

    this.errorPago.set('');
    this.mensajePago.set('');
    this.pagoRegistrado.set(false);
    this.pagoForm.enable();
    this.pagoForm.reset({ metodoPago: null, referenciaPago: '' });
    this.mostrandoFormularioPago.set(true);
  }

  cerrarFormularioPago(): void {
    if (this.registrandoPago()) return;
    this.mostrandoFormularioPago.set(false);
    this.errorPago.set('');
    this.mensajePago.set('');
    this.pagoRegistrado.set(false);
  }

  registrarPago(): void {
    const idVenta = this.idVentaCompletada();
    if (idVenta == null || this.registrandoPago() || this.pagoRegistrado()) return;
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    const { metodoPago, referenciaPago } = this.pagoForm.getRawValue();
    if (metodoPago == null) return;

    this.registrandoPago.set(true);
    this.pagoForm.disable();
    this.errorPago.set('');
    this.ventaService.actualizarPago(idVenta, {
      metodoPago,
      referenciaPago: referenciaPago?.trim() || null,
    }).subscribe({
      next: () => {
        this.registrandoPago.set(false);
        this.pagoRegistrado.set(true);
        this.mensajePago.set('Pago registrado correctamente');
        window.setTimeout(() => {
          if (this.mostrandoFormularioPago() && this.pagoRegistrado()) {
            this.cerrarFormularioPago();
          }
        }, 1800);
      },
      error: error => {
        this.errorPago.set(error?.error?.message || error?.error?.mensaje || 'Error al registrar el pago');
        this.registrandoPago.set(false);
        this.pagoForm.enable();
      },
    });
  }

  abrirFormularioCotizacion(): void {
    if (!this.puedeCrearCotizacion) { this.error.set('No tienes permiso para crear cotizaciones'); return; }
    if (!this.items().length) { this.error.set('Debes agregar al menos un artículo al carrito'); return; }
    this.error.set('');
    this.cotizacionForm.reset({ nit: '', nombre: '' });
    this.mostrandoFormularioCotizacion.set(true);
  }

  cerrarFormularioCotizacion(): void {
    if (this.cargando()) return;
    this.mostrandoFormularioCotizacion.set(false);
  }

  abrirFormularioPedido(): void {
    if (!this.puedeCrearPedido) { this.error.set('No tienes permiso para crear pedidos'); return; }
    const idVenta = this.idVentaCompletada();
    if (idVenta == null) return;

    this.errorPedido.set('');
    this.mensajePedido.set('');
    this.pedidoForm.reset({ idVenta, fechaEntrega: '', direccionEntrega: '', notasEntrega: '', numeroEntrega: '', productoDePedido: '' });
    this.detallesPedido.set([]);
    this.mostrandoFormularioPedido.set(true);
    this.cargandoDetallesPedido.set(true);
    this.ventaService.buscarPorId(idVenta).subscribe({
      next: ventaConDetalles => {
        const detalles = (ventaConDetalles.detalles ?? []).map(detalle => ({
          detalle,
          cantidad: Number(detalle.cantidad) || 0,
        }));
        this.detallesPedido.set(detalles);
        this.actualizarProductoDePedido();
        this.cargandoDetallesPedido.set(false);
      },
      error: () => {
        this.errorPedido.set('No se pudieron cargar los artículos de la venta');
        this.cargandoDetallesPedido.set(false);
      },
    });
  }

  cerrarFormularioPedido(): void {
    if (this.creandoPedido()) return;
    this.mostrandoFormularioPedido.set(false);
    this.errorPedido.set('');
    this.mensajePedido.set('');
  }

  generarPedido(): void {
    if (!this.puedeCrearPedido) { this.errorPedido.set('No tienes permiso para crear pedidos'); return; }
    const idVenta = this.idVentaCompletada();
    if (idVenta == null || this.creandoPedido() || this.cargandoDetallesPedido()) return;
    if (this.fechaEntregaAnterior()) {
      this.pedidoForm.controls['fechaEntrega'].markAsTouched();
      this.errorPedido.set('La fecha de entrega no puede ser anterior a hoy');
      return;
    }
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    const datos = this.pedidoForm.getRawValue();
    const pedido: Pedido = {
      idVenta,
      fechaEntrega: datos.fechaEntrega || undefined,
      direccionEntrega: datos.direccionEntrega?.trim() || undefined,
      notasEntrega: datos.notasEntrega?.trim() || undefined,
      numeroEntrega: datos.numeroEntrega?.trim() || undefined,
      productoDePedido: datos.productoDePedido || undefined,
    };

    this.creandoPedido.set(true);
    this.errorPedido.set('');
    this.pedidoService.crear(pedido).subscribe({
      next: () => {
        this.creandoPedido.set(false);
        this.pedidoCreado.set(true);
        this.mensajePedido.set('Pedido creado correctamente');
        window.setTimeout(() => {
          if (this.mostrandoFormularioPedido()) {
            this.cerrarFormularioPedido();
          }
        }, 2500);
      },
      error: error => {
        this.errorPedido.set(error?.error?.message || error?.error?.mensaje || 'Error al crear el pedido');
        this.creandoPedido.set(false);
      },
    });
  }

  fechaEntregaAnterior(): boolean {
    const fecha = this.pedidoForm.get('fechaEntrega')?.value;
    return typeof fecha === 'string' && fecha !== '' && fecha < this.fechaMinimaEntrega;
  }

  actualizarCantidadPedido(index: number, event: Event): void {
    const detalleEditable = this.detallesPedido()[index];
    if (!detalleEditable) return;

    const input = event.target as HTMLInputElement;
    const cantidadMaxima = Number(detalleEditable.detalle.cantidad) || 0;
    const cantidad = Math.min(cantidadMaxima, Math.max(0, Number(input.value) || 0));
    detalleEditable.cantidad = cantidad;
    input.value = cantidad.toString();
    this.detallesPedido.set([...this.detallesPedido()]);
    this.actualizarProductoDePedido();
  }

  private actualizarProductoDePedido(): void {
    const texto = this.detallesPedido()
      .filter(item => item.cantidad > 0)
      .map(item => `ID artículo: ${item.detalle.idArticulo ?? '—'} - ${this.articuloService.getNombreById(item.detalle.idArticulo)} - Cantidad: ${item.cantidad}`)
      .join('\n');
    this.pedidoForm.patchValue({ productoDePedido: texto });
  }

  generarCotizacion(): void {
    if (!this.puedeCrearCotizacion) { this.error.set('No tienes permiso para crear cotizaciones'); return; }
    if (!this.items().length) { this.error.set('Debes agregar al menos un artículo al carrito'); return; }
    if (this.cotizacionForm.invalid) {
      this.cotizacionForm.markAllAsTouched();
      return;
    }

    const { nit, nombre } = this.cotizacionForm.getRawValue();
    const dto: CotizacionCreateRequest = {
      nombre: nombre.trim(),
      nit: nit.trim(),
      detalles: this.items().map(item => ({
        idArticulo: item.idArticulo,
        cantidad: item.cantidad,
        porcDescuentoManual: item.porcDescuentoManual,
      })),
    };
    this.cargando.set(true); this.error.set(''); this.mensaje.set('');
    this.cotizacionService.crearConDetalles(dto).subscribe({
      next: () => {
        this.mostrandoFormularioCotizacion.set(false);
        this.resetearCompra();
        this.mensaje.set('Cotización creada correctamente');
        this.cargando.set(false);
      },
      error: error => {
        this.error.set(error?.error?.message || error?.error?.mensaje || 'Error al crear la cotización');
        this.cargando.set(false);
      },
    });
  }

  generarComprobante(): void {
    const idVenta = this.idVentaCompletada();
    if (idVenta == null || this.generandoComprobante()) return;

    this.generandoComprobante.set(true);
    this.errorComprobante.set('');

    this.ventaService.generarComprobante(idVenta).subscribe({
      next: response => {
        if (!response.body || !response.headers.get('Content-Type')?.toLowerCase().includes('application/pdf')) {
          this.errorComprobante.set('La respuesta no contiene un comprobante PDF válido.');
          this.generandoComprobante.set(false);
          return;
        }

        this.descargarPdf(response.body, response.headers.get('Content-Disposition'));
        this.generandoComprobante.set(false);
      },
      error: error => {
        this.errorComprobante.set(error?.error?.mensaje || error?.error?.message || 'No se pudo generar el comprobante');
        this.generandoComprobante.set(false);
      },
    });
  }

  private descargarPdf(pdf: Blob, contentDisposition: string | null): void {
    const nombre = this.obtenerNombreArchivo(contentDisposition) ?? 'comprobante.pdf';
    const url = URL.createObjectURL(pdf);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  private obtenerNombreArchivo(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const codificado = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (codificado) return decodeURIComponent(codificado.replace(/^"|"$/g, ''));
    return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
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
    this.idVentaCompletada.set(null);
    this.totalVentaCompletada.set(null);
    this.mostrandoFormularioPago.set(false);
    this.pagoRegistrado.set(false);
    this.errorPago.set('');
    this.mensajePago.set('');
    this.pedidoCreado.set(false);
    this.detallesPedido.set([]);
    this.cargandoDetallesPedido.set(false);
    this.generandoComprobante.set(false);
    this.errorComprobante.set('');
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
  private normalizarDescuento(value: number): number { return Math.min(100, this.normalizarNumero(value)); }

  get f() {
    return this.busquedaClienteForm.controls;
  }
}
