import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Observable } from 'rxjs';
import { DatosArticulosService } from '../../../core/services/datos-articulos.service';
import {
  AgrupacionDashboard,
  FiltroDashboard,
  HistorialMovimiento,
  MovimientoPeriodo,
  OrdenRotacion,
  Pagina,
  Rotacion,
  StockBajo,
} from '../../../core/models/dashboard.models';
import { etiquetaPeriodo } from '../../../core/utils/dashboard.utils';

interface MovimientoPivot {
  periodo: string;
  entrada: number;
  salida: number;
  ajuste: number;
}

interface ArticuloSeleccionado {
  idArticulo: number;
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-datos-articulos',
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './datos-articulos.html',
  styleUrl: './datos-articulos.css',
})
export class DatosArticulos implements OnInit {
  private readonly datosArticulosService = inject(DatosArticulosService);
  private readonly destroyRef = inject(DestroyRef);
  private historialRequestId = 0;

  readonly desde = signal('');
  readonly hasta = signal('');
  readonly agrupacion = signal<AgrupacionDashboard>('DIA');
  readonly ordenRotacion = signal<OrdenRotacion>('MAS_MOVIDOS');
  readonly rangoPredeterminado = computed(() => !this.desde() && !this.hasta());
  readonly errorRango = signal('');

  readonly stockBajo = signal<StockBajo[] | null>(null);
  readonly stockCargando = signal(false);
  readonly stockError = signal('');

  readonly movimientos = signal<MovimientoPeriodo[] | null>(null);
  readonly movimientosPivoteados = signal<MovimientoPivot[] | null>(null);
  readonly movimientosCargando = signal(false);
  readonly movimientosError = signal('');

  readonly rotacion = signal<Rotacion[] | null>(null);
  readonly rotacionCargando = signal(false);
  readonly rotacionError = signal('');

  readonly articuloSeleccionado = signal<ArticuloSeleccionado | null>(null);
  readonly historial = signal<Pagina<HistorialMovimiento> | null>(null);
  readonly paginaHistorial = signal(0);
  readonly historialCargando = signal(false);
  readonly historialError = signal('');

  readonly movimientosChartType = 'bar';
  readonly movimientosChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  private chartColors = {
    success: '',
    danger: '',
    primary: '',
  };

  readonly movimientosChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => String(value) },
      },
    },
  };

  readonly totalPaginasHistorial = computed(() => this.historial()?.totalPaginas ?? 0);
  readonly totalElementosHistorial = computed(() => this.historial()?.totalElementos ?? 0);

  ngOnInit(): void {
    this.chartColors = {
      success: this.readCssColor('--crud-success'),
      danger: this.readCssColor('--crud-danger'),
      primary: this.readCssColor('--crud-primary'),
    };

    this.cargarStockBajo();
    this.cargarSeccionesFiltradas();
  }

  actualizarDesde(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.desde.set(event.target.value);
      this.errorRango.set('');
    }
  }

  actualizarHasta(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.hasta.set(event.target.value);
      this.errorRango.set('');
    }
  }

  actualizarAgrupacion(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      const value = event.target.value;
      if (value === 'DIA' || value === 'SEMANA' || value === 'MES') {
        this.agrupacion.set(value);
      }
    }
  }

  aplicarFiltros(): void {
    if (this.desde() && this.hasta() && this.desde() > this.hasta()) {
      this.errorRango.set('La fecha Desde no puede ser posterior a Hasta.');
      return;
    }

    this.errorRango.set('');
    this.cargarSeccionesFiltradas();
  }

  limpiarFiltros(): void {
    this.desde.set('');
    this.hasta.set('');
    this.errorRango.set('');
    this.cargarSeccionesFiltradas();
  }

  cambiarOrdenRotacion(orden: OrdenRotacion): void {
    if (this.ordenRotacion() === orden) {
      return;
    }
    this.ordenRotacion.set(orden);
    this.cargarRotacion();
  }

  seleccionarArticulo(articulo: ArticuloSeleccionado): void {
    this.articuloSeleccionado.set(articulo);
    this.paginaHistorial.set(0);
    this.cargarHistorial();
  }

  cerrarHistorial(): void {
    this.historialRequestId++;
    this.articuloSeleccionado.set(null);
    this.historial.set(null);
    this.historialCargando.set(false);
    this.historialError.set('');
  }

  cambiarPaginaHistorial(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginasHistorial() || pagina === this.paginaHistorial()) {
      return;
    }
    this.paginaHistorial.set(pagina);
    this.cargarHistorial();
  }

  etiquetaTipoMovimiento(tipoMovimiento: string): string {
    switch (tipoMovimiento.toLowerCase()) {
      case 'entrada':
        return 'Entrada';
      case 'salida':
        return 'Salida';
      case 'ajuste':
        return 'Ajuste';
      default:
        return tipoMovimiento;
    }
  }

  etiquetaMotivo(motivo: string): string {
    switch (motivo.toLowerCase()) {
      case 'venta':
        return 'Venta';
      case 'orden_compra':
        return 'Orden de compra';
      case 'ajuste_manual':
        return 'Ajuste manual';
      case 'devolucion':
        return 'Devolución';
      default:
        return motivo;
    }
  }

  fechaLegible(fecha: string): string {
    const [fechaLocal, horaLocal] = fecha.split('T');
    const partes = fechaLocal?.split('-');
    if (!partes || partes.length !== 3) {
      return fecha;
    }
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}${horaLocal ? ` ${horaLocal.substring(0, 5)}` : ''}`;
  }

  private cargarStockBajo(): void {
    this.cargarConEstado(
      this.datosArticulosService.obtenerStockBajo(),
      (datos) => this.stockBajo.set(datos),
      this.stockCargando,
      this.stockError,
    );
  }

  private cargarSeccionesFiltradas(): void {
    const filtro: FiltroDashboard = {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    this.cargarConEstado(
      this.datosArticulosService.obtenerMovimientosPorPeriodo(filtro, this.agrupacion()),
      (datos) => {
        this.movimientos.set(datos);
        const pivoteados = this.pivotearMovimientos(datos);
        this.movimientosPivoteados.set(pivoteados);
        this.actualizarGraficaMovimientos(pivoteados);
      },
      this.movimientosCargando,
      this.movimientosError,
    );

    this.cargarRotacion(filtro);
  }

  private cargarRotacion(filtro?: FiltroDashboard): void {
    const filtros = filtro ?? {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    this.cargarConEstado(
      this.datosArticulosService.obtenerRotacion(filtros, this.ordenRotacion()),
      (datos) => this.rotacion.set(datos),
      this.rotacionCargando,
      this.rotacionError,
    );
  }

  private cargarHistorial(): void {
    const articulo = this.articuloSeleccionado();
    if (!articulo) {
      return;
    }

    const requestId = ++this.historialRequestId;
    this.historialCargando.set(true);
    this.historialError.set('');

    this.datosArticulosService
      .obtenerHistorialArticulo(articulo.idArticulo, this.paginaHistorial())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (datos) => {
          if (requestId === this.historialRequestId) {
            this.historial.set(datos);
          }
        },
        error: (error: unknown) => {
          if (requestId === this.historialRequestId) {
            this.historialError.set(this.mensajeError(error));
            this.historialCargando.set(false);
          }
        },
        complete: () => {
          if (requestId === this.historialRequestId) {
            this.historialCargando.set(false);
          }
        },
      });
  }

  private cargarConEstado<T>(
    request: Observable<T>,
    guardarDatos: (datos: T) => void,
    cargando: WritableSignal<boolean>,
    error: WritableSignal<string>,
  ): void {
    cargando.set(true);
    error.set('');

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: guardarDatos,
      error: (err: unknown) => {
        error.set(this.mensajeError(err));
        cargando.set(false);
      },
      complete: () => cargando.set(false),
    });
  }

  private pivotearMovimientos(filas: MovimientoPeriodo[]): MovimientoPivot[] {
    const mapa = new Map<string, MovimientoPivot>();
    for (const filaMovimiento of filas) {
      const fila = mapa.get(filaMovimiento.periodo) ?? {
        periodo: filaMovimiento.periodo,
        entrada: 0,
        salida: 0,
        ajuste: 0,
      };
      switch (filaMovimiento.tipoMovimiento.toLowerCase()) {
        case 'entrada':
          fila.entrada += filaMovimiento.cantidadTotal;
          break;
        case 'salida':
          fila.salida += filaMovimiento.cantidadTotal;
          break;
        case 'ajuste':
          fila.ajuste += filaMovimiento.variacionNeta;
          break;
      }
      mapa.set(filaMovimiento.periodo, fila);
    }
    return [...mapa.values()].sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private actualizarGraficaMovimientos(datos: MovimientoPivot[]): void {
    this.movimientosChartData.set({
      labels: datos.map((item) => etiquetaPeriodo(item.periodo, this.agrupacion())),
      datasets: [
        {
          label: 'Entradas',
          data: datos.map((item) => item.entrada),
          backgroundColor: this.chartColors.success,
        },
        {
          label: 'Salidas',
          data: datos.map((item) => item.salida),
          backgroundColor: this.chartColors.danger,
        },
        {
          label: 'Ajustes (neto)',
          data: datos.map((item) => item.ajuste),
          backgroundColor: this.chartColors.primary,
        },
      ],
    });
  }

  private mensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrió un error inesperado al cargar esta sección.';
    }
    if (error.status === 404) {
      return 'Artículo no encontrado.';
    }
    if (error.status === 403) {
      return 'No tienes permiso para consultar este dashboard.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    }

    const payload: unknown = error.error;
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }
    if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
      const body = payload as Record<string, unknown>;
      if (typeof body['mensaje'] === 'string' && body['mensaje'].trim()) {
        return body['mensaje'];
      }
      if (Array.isArray(body['mensajes'])) {
        const messages = body['mensajes'].filter(
          (message): message is string => typeof message === 'string' && message.trim().length > 0,
        );
        if (messages.length > 0) {
          return messages.join(' · ');
        }
      }
      if (typeof body['mensajes'] === 'string' && body['mensajes'].trim()) {
        return body['mensajes'];
      }
      if (typeof body['error'] === 'string' && body['error'].trim()) {
        return body['error'];
      }
    }

    return `No se pudo cargar esta sección (HTTP ${error.status}).`;
  }

  private readCssColor(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
}
