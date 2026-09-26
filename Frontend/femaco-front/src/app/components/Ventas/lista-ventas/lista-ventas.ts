import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TimeoutError } from 'rxjs';
import { EstadoVenta } from '../../../core/models/catalogo-models/estado-venta.model';
import { Pedido } from '../../../core/models/pedido.model';
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
import { PedidoService } from '../../../core/services/pedido.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { VentaConDetalles, VentaService } from '../../../core/services/venta.service';
import { VentaFelService } from '../../../core/services/venta-fel.service';

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
  private readonly ventaFelService = inject(VentaFelService);

  filtrosForm!: FormGroup;
  motivoAnulacionForm!: FormGroup;
  pedidoForm!: FormGroup;
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
  certificandoFactura = signal(false);
  anulandoFactura = signal(false);
  mostrandoFormularioPedido = signal(false);
  creandoPedido = signal(false);
  errorPedido = signal('');
  errorFactura = signal('');
  mostrarModalAnulacion = signal(false);
  ultimaOperacionFel = signal<'certificar' | 'anular' | null>(null);
  motivoAnulacionFactura = signal('');

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('ventas');
  }

  get puedeAnular(): boolean {
    return this.permisos.baja;
  }

  get permisosPedido() {
    return this.conjuntoMenuService.getPermisosPorPagina('pedidos');
  }

  get puedeCrearPedido(): boolean {
    return this.permisosPedido.alta;
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
    this.motivoAnulacionForm = this.fb.group({ motivo: [''] });
    this.pedidoForm = this.fb.group({
      idVenta: [{ value: null, disabled: true }],
      fechaEntrega: [''],
      direccionEntrega: [''],
      notasEntrega: [''],
      numeroEntrega: [''],
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
    if (this.anulando() || this.anulandoFactura() || this.creandoPedido()) return;
    this.ventaSeleccionada.set(null);
    this.errorDetalle.set('');
    this.errorFactura.set('');
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
    });
    this.mostrandoFormularioPedido.set(true);
  }

  cerrarFormularioPedido(): void {
    if (this.creandoPedido()) return;
    this.mostrandoFormularioPedido.set(false);
    this.errorPedido.set('');
  }

  generarPedido(): void {
    if (!this.puedeCrearPedido || this.creandoPedido()) return;
    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
    if (idVenta == null) return;

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

  generarFactura(): void {
    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
    if (idVenta == null || this.certificandoFactura() || this.anulandoFactura()) return;

    this.certificandoFactura.set(true);
    this.errorFactura.set('');
    this.ultimaOperacionFel.set('certificar');
    this.ventaFelService.certificar(idVenta).subscribe({
      next: response => this.procesarRespuestaFactura(response, 'factura'),
      error: error => void this.manejarErrorFactura(error),
    });
  }

  anularFactura(): void {
    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
    if (idVenta == null || this.certificandoFactura() || this.anulandoFactura()) return;

    const motivo = this.motivoAnulacionForm.value.motivo?.trim();
    if (!motivo) {
      this.motivoAnulacionForm.get('motivo')?.markAsTouched();
      return;
    }

    this.mostrarModalAnulacion.set(false);
    this.anulandoFactura.set(true);
    this.errorFactura.set('');
    this.ultimaOperacionFel.set('anular');
    this.motivoAnulacionFactura.set(motivo);
    this.ventaFelService.anular(idVenta, motivo).subscribe({
      next: response => this.procesarRespuestaFactura(response, 'anulación'),
      error: error => void this.manejarErrorFactura(error),
    });
  }

  abrirModalAnulacion(): void {
    if (this.certificandoFactura() || this.anulandoFactura()) return;
    this.motivoAnulacionForm.reset({ motivo: '' });
    this.motivoAnulacionForm.markAsUntouched();
    this.mostrarModalAnulacion.set(true);
  }

  cerrarModalAnulacion(): void {
    if (this.anulandoFactura()) return;
    this.mostrarModalAnulacion.set(false);
  }

  reintentarFactura(): void {
    if (this.ultimaOperacionFel() !== 'anular') {
      this.generarFactura();
      return;
    }

    const idVenta = this.ventaSeleccionada()?.venta.idVenta;
    const motivo = this.motivoAnulacionFactura();
    if (idVenta == null || !motivo || this.certificandoFactura() || this.anulandoFactura()) return;

    this.anulandoFactura.set(true);
    this.errorFactura.set('');
    this.ventaFelService.anular(idVenta, motivo).subscribe({
      next: response => this.procesarRespuestaFactura(response, 'anulación'),
      error: error => void this.manejarErrorFactura(error),
    });
  }

  private procesarRespuestaFactura(response: { body: Blob | null; headers: { get(name: string): string | null } }, operacion: string): void {
    if (!response.body || !response.headers.get('Content-Type')?.toLowerCase().includes('application/pdf')) {
      void this.manejarErrorFactura({ error: response.body, status: 200 });
      return;
    }

    this.descargarFactura(response.body, response.headers.get('Content-Disposition'));
    this.certificandoFactura.set(false);
    this.anulandoFactura.set(false);
    this.mensaje.set(`${operacion === 'factura' ? 'Factura generada' : 'Factura anulada'} correctamente`);
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
    this.certificandoFactura.set(false);
    this.anulandoFactura.set(false);

    if (error instanceof TimeoutError || (error as { name?: string })?.name === 'TimeoutError') {
      this.errorFactura.set('La operación está tardando más de lo esperado. Puede que se haya completado del lado del servidor. Verifica el estado de la venta antes de reintentar, o inténtalo de nuevo en unos momentos.');
      return;
    }

    const respuesta = error as HttpErrorResponse;
    const payload = await this.leerErrorFel(respuesta?.error ?? error);
    const origen = payload?.origen ? ` [${payload.origen}]` : '';
    this.errorFactura.set(`No se pudo completar la operación FEL${origen}: ${payload?.mensaje || 'Error inesperado.'}`);
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
