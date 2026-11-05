import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadoVenta } from '../../../core/models/catalogo-models/estado-venta.model';
import { Pedido } from '../../../core/models/pedido.model';
import { MetodoPago, Venta, VentaFiltro } from '../../../core/models/venta.model';
import { VentaDetalle } from '../../../core/models/venta-detalle.model';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { ClieneNitPipe } from '../../../core/pipes/cliene-nit-pipe';
import { ClienteNombrePipe } from '../../../core/pipes/cliente-nombre-pipe';
import { EstadoVentaNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-venta-nombre-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { EstadoVentaService } from '../../../core/services/catalogo-services/estado-venta.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { VentaConDetalles, VentaService } from '../../../core/services/venta.service';

interface DetallePedidoEditable {
  detalle: VentaDetalle;
  cantidad: number;
}

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
  private readonly pedidoService = inject(PedidoService);

  filtrosForm!: FormGroup;
  pedidoForm!: FormGroup;
  pagoForm!: FormGroup;
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
  generandoComprobante = signal(false);
  mostrandoFormularioPedido = signal(false);
  creandoPedido = signal(false);
  mostrandoFormularioPago = signal(false);
  actualizandoPago = signal(false);
  pagoActualizado = signal(false);
  errorPago = signal('');
  mensajePago = signal('');
  errorPedido = signal('');
  detallesPedido = signal<DetallePedidoEditable[]>([]);
  errorComprobante = signal('');
  readonly metodosPago: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'CHEQUE', 'TRANSFERENCIA', 'DEPOSITO'];

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('ventas');
  }

  get puedeAnular(): boolean {
    return this.permisos.baja;
  }

  get puedeActualizarPago(): boolean {
    return this.permisos.alta;
  }

  get permisosPedido() {
    return this.conjuntoMenuService.getPermisosPorPagina('pedidos');
  }

  get puedeCrearPedido(): boolean {
    return this.permisosPedido.alta;
  }

  get fechaMinimaEntrega(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
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
    this.pedidoForm = this.fb.group({
      idVenta: [{ value: null, disabled: true }],
      fechaEntrega: [''],
      direccionEntrega: ['', Validators.required],
      notasEntrega: [''],
      numeroEntrega: ['', Validators.required],
      productoDePedido: [{ value: '', disabled: true }],
    });
    this.pagoForm = this.fb.group({
      metodoPago: [null, Validators.required],
      referenciaPago: ['', Validators.maxLength(45)],
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cargandoDetalle.set(true);
    this.errorDetalle.set('');
    this.errorComprobante.set('');
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
    if (this.anulando() || this.generandoComprobante() || this.creandoPedido()
      || this.actualizandoPago() || this.mostrandoFormularioPago()) return;
    this.ventaSeleccionada.set(null);
    this.errorDetalle.set('');
    this.errorComprobante.set('');
  }

  abrirFormularioPago(): void {
    const venta = this.ventaSeleccionada()?.venta;
    if (venta?.idVenta == null || this.actualizandoPago()) return;

    this.errorPago.set('');
    this.mensajePago.set('');
    this.pagoActualizado.set(false);
    this.pagoForm.enable();
    this.pagoForm.reset({
      metodoPago: venta.metodoPago ?? null,
      referenciaPago: venta.referenciaPago ?? '',
    });
    this.mostrandoFormularioPago.set(true);
  }

  cerrarFormularioPago(): void {
    if (this.actualizandoPago()) return;
    this.mostrandoFormularioPago.set(false);
    this.errorPago.set('');
    this.mensajePago.set('');
    this.pagoActualizado.set(false);
  }

  actualizarPago(): void {
    const venta = this.ventaSeleccionada()?.venta;
    if (venta?.idVenta == null || this.actualizandoPago() || this.pagoActualizado()) return;
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    const { metodoPago, referenciaPago } = this.pagoForm.getRawValue();
    if (metodoPago == null) return;

    this.actualizandoPago.set(true);
    this.pagoForm.disable();
    this.errorPago.set('');
    this.ventaService.actualizarPago(venta.idVenta, {
      metodoPago,
      referenciaPago: referenciaPago.trim() || null,
    }).subscribe({
      next: ventaActualizada => {
        this.ventaSeleccionada.update(detalle =>
          detalle ? { ...detalle, venta: ventaActualizada } : detalle
        );
        this.lista.update(ventas =>
          ventas.map(item => item.idVenta === ventaActualizada.idVenta ? ventaActualizada : item)
        );
        this.actualizandoPago.set(false);
        this.pagoActualizado.set(true);
        this.mensajePago.set('Método de pago actualizado correctamente');
        setTimeout(() => {
          if (this.mostrandoFormularioPago() && this.pagoActualizado()) {
            this.cerrarFormularioPago();
          }
        }, 1800);
      },
      error: error => {
        this.errorPago.set(error?.error?.message || error?.error?.mensaje || 'Error al actualizar el método de pago');
        this.actualizandoPago.set(false);
        this.pagoForm.enable();
      },
    });
  }

  abrirFormularioPedido(): void {
    if (!this.puedeCrearPedido || this.creandoPedido()) return;
    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
    if (idVenta == null) return;

    this.errorPedido.set('');
    this.pedidoForm.reset({
      idVenta,
      fechaEntrega: '',
      direccionEntrega: '',
      notasEntrega: '',
      numeroEntrega: '',
      productoDePedido: '',
    });
    const detalles = this.ventaSeleccionada()?.detalles ?? [];
    this.detallesPedido.set(detalles.map(detalle => ({
      detalle,
      cantidad: Number(detalle.cantidad) || 0,
    })));
    this.actualizarProductoDePedido();
    this.mostrandoFormularioPedido.set(true);
  }

  cerrarFormularioPedido(): void {
    if (this.creandoPedido()) return;
    this.mostrandoFormularioPedido.set(false);
    this.errorPedido.set('');
    this.detallesPedido.set([]);
  }

  generarPedido(): void {
    if (!this.puedeCrearPedido || this.creandoPedido()) return;
    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
    if (idVenta == null) return;
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
        this.mostrandoFormularioPedido.set(false);
        this.creandoPedido.set(false);
        this.mensaje.set('Pedido creado correctamente');
        setTimeout(() => this.mensaje.set(''), 3500);
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

  generarComprobante(): void {
    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
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
        this.mensaje.set('Comprobante generado correctamente');
      },
      error: error => {
        this.generandoComprobante.set(false);
        void this.manejarErrorComprobante(error);
      },
    });
  }

  private async manejarErrorComprobante(error: unknown): Promise<void> {
    const respuesta = error as HttpErrorResponse;
    const payload = await this.leerErrorRespuesta(respuesta?.error ?? error);
    this.errorComprobante.set(payload?.mensaje || 'No se pudo generar el comprobante');
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

  private async leerErrorRespuesta(error: unknown): Promise<{ mensaje?: string } | null> {
    if (error instanceof Blob) {
      try {
        return JSON.parse(await error.text()) as { mensaje?: string };
      } catch {
        return null;
      }
    }

    if (typeof error === 'string') {
      try {
        return JSON.parse(error) as { mensaje?: string };
      } catch {
        return { mensaje: error };
      }
    }

    return error && typeof error === 'object' ? error as { mensaje?: string } : null;
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
