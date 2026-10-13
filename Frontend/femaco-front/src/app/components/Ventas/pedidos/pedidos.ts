import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pedido, PagePedido, PedidoFiltros } from '../../../core/models/pedido.model';
import { EstadoPedidoNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-pedido-nombre-pipe';
import { EstadoPedido } from '../../../core/models/catalogo-models/estado-pedido.model';
import { ArticuloNombrePipe } from '../../../core/pipes/articulo-nombre-pipe-pipe';
import { ClieneNitPipe } from '../../../core/pipes/cliene-nit-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { AuthService } from '../../../core/services/auth.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { EstadoPedidoService } from '../../../core/services/catalogo-services/estado-pedido.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaConDetalles, VentaService } from '../../../core/services/venta.service';

interface DiaPedidos {
  clave: string;
  nombre: string;
  fecha: string;
  pedidos: Pedido[];
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, EstadoPedidoNombrePipe, ArticuloNombrePipe, ClieneNitPipe, UsuariosEmailPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pedidoService = inject(PedidoService);
  private readonly articuloService = inject(ArticuloService);
  private readonly clienteService = inject(ClienteService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly estadoPedidoService = inject(EstadoPedidoService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);
  private readonly ventaService = inject(VentaService);

  form!: FormGroup;
  filtrosForm!: FormGroup;
  lista = signal<Pedido[]>([]);
  pendientes = signal<Pedido[]>([]);
  estados = signal<EstadoPedido[]>([]);
  pedidoEditando = signal<Pedido | null>(null);
  cargando = signal(false);
  cargandoPendientes = signal(false);
  cargandoDashboard = signal(false);
  diasDashboard = signal<DiaPedidos[]>([]);
  mensaje = signal('');
  error = signal('');
  errorPendientes = signal('');
  ventaConsultada = signal<VentaConDetalles | null>(null);
  cargandoVenta = signal(false);
  errorVenta = signal('');
  generandoListado = signal(false);
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  tamanioPagina = signal(5);
  paginaPendientes = signal(0);
  totalPaginasPendientes = signal(0);
  totalElementosPendientes = signal(0);
  tamanioPaginaPendientes = signal(5);
  readonly tamanosPagina = [5, 10, 20, 50];
  editando = false;
  modoEdicion = false;
  idEditando: number | null = null;

  get permisos() { return this.conjuntoMenuService.getPermisosPorPagina('pedidos'); }
  get puedeEditar(): boolean { return this.permisos.cambio; }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      idPedido: [''],
      idVenta: [''],
      idEstadoPedido: [null],
      q: [''],
      numeroEntrega: [''],
      nitCliente: [''],
      numeroFactura: [''],
      fechaEntregaDesde: [''],
      fechaEntregaHasta: [''],
      fechaCreacionDesde: [''],
      fechaCreacionHasta: [''],
    });
    this.form = this.fb.group({
      fechaEntrega: ['', Validators.required],
      direccionEntrega: ['', [Validators.required, Validators.maxLength(255)]],
      numeroEntrega: ['', Validators.maxLength(45)],
      notasEntrega: ['', Validators.maxLength(500)],
      productoDePedido: [{ value: '', disabled: true }],
      idEstadoPedido: [null, Validators.required],
    });
    this.form.disable();
    this.estadoPedidoService.buscarTodos().subscribe({ next: estados => this.estados.set(estados ?? []) });
    this.estadoPedidoService.loadNombreCache().subscribe();
    this.articuloService.loadNombreCache().subscribe();
    this.clienteService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
    this.cargarLista();
    this.cargarPendientes();
    this.cargarDashboard();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');
    this.pedidoService.buscarPaginado({
      ...this.obtenerFiltros(),
      page: this.paginaActual(),
      size: this.tamanioPagina(),
      sort: 'fechaCreacion,desc',
    }).subscribe({
      next: (pagina: PagePedido) => {
        this.lista.set(pagina.content ?? []);
        const totalPaginas = pagina.totalPages ?? 0;
        const paginaSolicitada = this.paginaActual();
        const paginaValida = Math.min(Math.max(0, pagina.number ?? paginaSolicitada), Math.max(0, totalPaginas - 1));
        this.totalPaginas.set(totalPaginas);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(paginaValida);
        if (paginaValida !== paginaSolicitada) {
          this.cargarLista();
          return;
        }
        this.cargando.set(false);
      },
      error: () => { this.error.set('Error al cargar los pedidos'); this.cargando.set(false); },
    });
  }

  cargarPendientes(): void {
    this.cargandoPendientes.set(true);
    this.errorPendientes.set('');
    this.pedidoService.buscarPendientes(this.paginaPendientes(), this.tamanioPaginaPendientes()).subscribe({
      next: (pagina: PagePedido) => {
        this.pendientes.set(pagina.content ?? []);
        const totalPaginas = pagina.totalPages ?? 0;
        const paginaSolicitada = this.paginaPendientes();
        const paginaValida = Math.min(Math.max(0, pagina.number ?? paginaSolicitada), Math.max(0, totalPaginas - 1));
        this.totalPaginasPendientes.set(totalPaginas);
        this.totalElementosPendientes.set(pagina.totalElements ?? 0);
        this.paginaPendientes.set(paginaValida);
        if (paginaValida !== paginaSolicitada) {
          this.cargarPendientes();
          return;
        }
        this.cargandoPendientes.set(false);
      },
      error: () => { this.errorPendientes.set('Error al cargar los pedidos pendientes'); this.cargandoPendientes.set(false); },
    });
  }

  private cargarDashboard(): void {
    this.cargandoDashboard.set(true);
    this.pedidoService.buscarPendientes(0, 1000, 'fechaEntrega', 'asc').subscribe({
      next: pagina => {
        this.diasDashboard.set(this.construirDiasDashboard(pagina.content ?? []));
        this.cargandoDashboard.set(false);
      },
      error: () => {
        this.diasDashboard.set(this.construirDiasDashboard([]));
        this.cargandoDashboard.set(false);
      },
    });
  }

  private construirDiasDashboard(pedidos: Pedido[]): DiaPedidos[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias: DiaPedidos[] = [];

    for (let indice = 0; indice < 7; indice++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + indice);
      const clave = this.formatearClaveFecha(fecha);
      dias.push({
        clave,
        nombre: indice === 0 ? 'Hoy' : fecha.toLocaleDateString('es-ES', { weekday: 'long' }),
        fecha: fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        pedidos: pedidos.filter(pedido => this.obtenerClaveFecha(pedido.fechaEntrega) === clave),
      });
    }

    return dias;
  }

  private obtenerClaveFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '';
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha.slice(0, 10);
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? '' : this.formatearClaveFecha(valor);
  }

  estaVencido(fecha: string | Date | undefined): boolean {
    const claveFecha = this.obtenerClaveFecha(fecha);
    return claveFecha !== '' && claveFecha < this.formatearClaveFecha(new Date());
  }

  private formatearClaveFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  verDetalles(item: Pedido): void {
    if (item.idPedido == null) return;
    this.editando = true;
    this.modoEdicion = false;
    this.cargarPedidoEnFormulario(item);
    this.form.disable();
  }

  editarPedido(): void {
    if (!this.puedeEditar || !this.pedidoEditando()) return;
    this.modoEdicion = true;
    this.form.enable();
    this.form.controls['productoDePedido'].disable();
  }

  verVenta(item: Pedido): void {
    if (item.idVenta == null) {
      this.ventaConsultada.set(null);
      this.errorVenta.set('Este pedido no tiene una venta asociada');
      return;
    }

    this.cargandoVenta.set(true);
    this.ventaConsultada.set(null);
    this.errorVenta.set('');
    this.ventaService.buscarPorId(item.idVenta).subscribe({
      next: venta => {
        this.ventaConsultada.set(venta);
        this.cargandoVenta.set(false);
      },
      error: () => {
        this.errorVenta.set('Error al consultar la venta asociada');
        this.cargandoVenta.set(false);
      },
    });
  }

  verVentaActual(): void {
    const pedido = this.pedidoEditando();
    if (pedido) this.verVenta(pedido);
  }

  imprimirListado(): void {
    const idPedido = this.pedidoEditando()?.idPedido;
    if (idPedido == null || this.generandoListado()) return;

    this.generandoListado.set(true);
    this.error.set('');
    this.pedidoService.generarListadoEntrega(idPedido).subscribe({
      next: response => {
        if (!response.body || !response.headers.get('Content-Type')?.toLowerCase().includes('application/pdf')) {
          this.error.set('La respuesta no contiene un listado PDF válido.');
          this.generandoListado.set(false);
          return;
        }

        this.descargarListado(response.body, response.headers.get('Content-Disposition'), idPedido);
        this.generandoListado.set(false);
      },
      error: error => {
        this.generandoListado.set(false);
        this.error.set(error?.error?.mensaje || error?.error?.message || 'No se pudo generar el listado de entrega');
      },
    });
  }

  private descargarListado(pdf: Blob, contentDisposition: string | null, idPedido: number): void {
    const nombre = this.obtenerNombreArchivo(contentDisposition) ?? `listado-entrega-pedido-${idPedido}.pdf`;
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

  cerrarVentaConsultada(): void {
    this.ventaConsultada.set(null);
    this.errorVenta.set('');
  }

  private cargarPedidoEnFormulario(item: Pedido): void {
    this.idEditando = item.idPedido ?? null;
    this.pedidoEditando.set(item);
    this.form.patchValue({
      fechaEntrega: this.formatearFecha(item.fechaEntrega),
      direccionEntrega: item.direccionEntrega ?? '',
      numeroEntrega: item.numeroEntrega ?? '',
      notasEntrega: item.notasEntrega ?? '',
      productoDePedido: item.productoDePedido ?? '',
      idEstadoPedido: item.idEstadoPedido ?? null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(): void {
    if (!this.modoEdicion || !this.puedeEditar || this.idEditando == null) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const usuarioId = this.authService.getCurrentUser()?.idUsuario;
    if (!usuarioId) { this.error.set('No se encontró el usuario autenticado'); return; }

    const value = this.form.value;
    const datos: Pedido = {
      fechaEntrega: value.fechaEntrega,
      direccionEntrega: value.direccionEntrega?.trim(),
      numeroEntrega: value.numeroEntrega?.trim() || undefined,
      notasEntrega: value.notasEntrega?.trim() || undefined,
      idEstadoPedido: Number(value.idEstadoPedido),
      usuarioModif: usuarioId,
    };

    this.cargando.set(true);
    this.error.set('');
    this.pedidoService.actualizar(this.idEditando, datos).subscribe({
      next: () => {
        this.mensaje.set('Pedido actualizado correctamente');
        this.resetForm();
        this.cargarLista();
        this.cargarPendientes();
      },
      error: () => { this.error.set('Error al actualizar el pedido'); this.cargando.set(false); },
    });
  }

  cancelar(): void { this.resetForm(); }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarLista();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      idPedido: '',
      idVenta: '',
      idEstadoPedido: null,
      q: '',
      numeroEntrega: '',
      nitCliente: '',
      numeroFactura: '',
      fechaEntregaDesde: '',
      fechaEntregaHasta: '',
      fechaCreacionDesde: '',
      fechaCreacionHasta: '',
    });
    this.aplicarFiltros();
  }

  cambiarTamano(): void { this.paginaActual.set(0); this.cargarLista(); }

  cambiarTamanoPendientes(): void { this.paginaPendientes.set(0); this.cargarPendientes(); }

  onTamanioPaginaChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.tamanioPagina.set(Number(target?.value ?? this.tamanioPagina()));
    this.cambiarTamano();
  }

  onTamanioPaginaPendientesChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.tamanioPaginaPendientes.set(Number(target?.value ?? this.tamanioPaginaPendientes()));
    this.cambiarTamanoPendientes();
  }

  irAPagina(pagina: number): void {
    if (this.cargando() || pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarLista();
  }

  irAPaginaPendientes(pagina: number): void {
    if (this.cargandoPendientes() || pagina < 0 || pagina >= this.totalPaginasPendientes() || pagina === this.paginaPendientes()) return;
    this.paginaPendientes.set(pagina);
    this.cargarPendientes();
  }

  private resetForm(): void {
    this.form.reset({ fechaEntrega: '', direccionEntrega: '', numeroEntrega: '', notasEntrega: '', productoDePedido: '', idEstadoPedido: null });
    this.form.disable();
    this.editando = false;
    this.modoEdicion = false;
    this.idEditando = null;
    this.pedidoEditando.set(null);
    this.cargando.set(false);
  }

  private obtenerFiltros(): PedidoFiltros {
    const value = this.filtrosForm.getRawValue();
    return {
      idPedido: this.convertirNumero(value.idPedido),
      idVenta: this.convertirNumero(value.idVenta),
      idEstadoPedido: this.convertirNumero(value.idEstadoPedido),
      q: this.limpiarTexto(value.q),
      numeroEntrega: this.limpiarTexto(value.numeroEntrega),
      nitCliente: this.limpiarTexto(value.nitCliente),
      numeroFactura: this.limpiarTexto(value.numeroFactura),
      fechaEntregaDesde: value.fechaEntregaDesde || undefined,
      fechaEntregaHasta: value.fechaEntregaHasta || undefined,
      fechaCreacionDesde: value.fechaCreacionDesde || undefined,
      fechaCreacionHasta: value.fechaCreacionHasta || undefined,
    };
  }

  private convertirNumero(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const numero = Number(value);
    return Number.isNaN(numero) ? undefined : numero;
  }

  private limpiarTexto(value: unknown): string | undefined {
    const texto = String(value ?? '').trim();
    return texto || undefined;
  }

  private formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '';
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return '';
    return valor.toISOString().slice(0, 10);
  }

  get f() { return this.form.controls; }
}
