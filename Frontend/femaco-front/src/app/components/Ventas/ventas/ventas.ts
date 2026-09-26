import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimeoutError } from 'rxjs';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo, ArticuloFiltro } from '../../../core/models/articulo.model';
import { Cliente as ClienteModel } from '../../../core/models/cliente.model';
import { CotizacionCreateRequest } from '../../../core/models/cotizacion.model';
import { Pedido } from '../../../core/models/pedido.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
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
import { VentaFelService } from '../../../core/services/venta-fel.service';

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
  private readonly cotizacionService = inject(CotizacionService);
  private readonly pedidoService = inject(PedidoService);
  private readonly articuloService = inject(ArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly ventaService = inject(VentaService);
  private readonly ventaFelService = inject(VentaFelService);
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
    direccionEntrega: ['', Validators.maxLength(1000)],
    notasEntrega: ['', Validators.maxLength(1000)],
    numeroEntrega: ['', Validators.maxLength(50)],
  });
  mostrandoFormularioCotizacion = signal(false);
  mostrandoFormularioPedido = signal(false);
  creandoPedido = signal(false);
  pedidoCreado = signal(false);
  errorPedido = signal('');
  mensajePedido = signal('');
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
  certificando = signal(false);
  errorFactura = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];

  get permisos() { return this.conjuntoMenuService.getPermisosPorPagina('ventas'); }
  get puedeCrear(): boolean { return this.permisos.alta; }
  get permisosCotizacion() { return this.conjuntoMenuService.getPermisosPorPagina('cotizacion'); }
  get puedeCrearCotizacion(): boolean { return this.permisosCotizacion.alta; }
  get permisosPedido() { return this.conjuntoMenuService.getPermisosPorPagina('pedidos'); }
  get puedeCrearPedido(): boolean { return this.permisosPedido.alta; }
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
    if (!window.confirm('¿Desea crear la venta con el cliente y los artículos seleccionados?')) return;
    const dto: VentaCreateRequest = { idCliente, detalles: this.items().map(item => ({ idArticulo: item.idArticulo, cantidad: item.cantidad, porcDescuentoManual: item.porcDescuentoManual })) };
    this.cargando.set(true); this.error.set(''); this.mensaje.set('');
    this.ventaService.crearConDetalles(dto).subscribe({
      next: venta => {
        this.mensaje.set('Venta creada correctamente');
        this.idVentaCompletada.set(venta.idVenta ?? null);
        this.errorFactura.set('');
        this.ventaCompletada.set(true);
        this.cargando.set(false);
      },
      error: error => { this.error.set(error?.error?.message || error?.error?.mensaje || 'Error al crear la venta'); this.cargando.set(false); },
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
    this.pedidoForm.reset({ idVenta, fechaEntrega: '', direccionEntrega: '', notasEntrega: '', numeroEntrega: '' });
    this.mostrandoFormularioPedido.set(true);
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
    if (idVenta == null || this.creandoPedido()) return;
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

  generarFactura(): void {
    const idVenta = this.idVentaCompletada();
    if (idVenta == null || this.certificando()) return;

    this.certificando.set(true);
    this.errorFactura.set('');

    this.ventaFelService.certificar(idVenta).subscribe({
      next: response => {
        if (!response.body || !response.headers.get('Content-Type')?.toLowerCase().includes('application/pdf')) {
          void this.manejarErrorFactura({ error: response.body, status: response.status });
          return;
        }

        this.descargarFactura(response.body, response.headers.get('Content-Disposition'));
        this.certificando.set(false);
      },
      error: error => void this.manejarErrorFactura(error),
    });
  }

  private descargarFactura(pdf: Blob, contentDisposition: string | null): void {
    const nombre = this.obtenerNombreArchivo(contentDisposition) ?? 'factura.pdf';
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

  private async manejarErrorFactura(error: unknown): Promise<void> {
    this.certificando.set(false);

    if (error instanceof TimeoutError || (error as { name?: string })?.name === 'TimeoutError') {
      this.errorFactura.set('La operación está tardando más de lo esperado. Puede que se haya completado del lado del servidor. Verifica el estado de la venta antes de reintentar, o inténtalo de nuevo en unos momentos.');
      return;
    }

    const respuesta = error as HttpErrorResponse;
    const payload = await this.leerErrorFel(respuesta?.error ?? error);
    const origen = payload?.origen ? ` [${payload.origen}]` : '';
    this.errorFactura.set(`No se pudo generar la factura${origen}: ${payload?.mensaje || 'Error inesperado al certificar la venta.'}`);
  }

  private async leerErrorFel(error: unknown): Promise<{ origen?: string; mensaje?: string } | null> {
    if (error instanceof Blob) {
      try {
        return JSON.parse(await error.text()) as { origen?: string; mensaje?: string };
      } catch {
        return null;
      }
    }

    if (typeof error === 'string') {
      try {
        return JSON.parse(error) as { origen?: string; mensaje?: string };
      } catch {
        return { mensaje: error };
      }
    }

    return error && typeof error === 'object' ? error as { origen?: string; mensaje?: string } : null;
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
    this.pedidoCreado.set(false);
    this.certificando.set(false);
    this.errorFactura.set('');
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
