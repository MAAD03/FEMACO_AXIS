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
import { DatosVentasService } from '../../../core/services/datos-ventas.service';
import {
  AgrupacionDashboard,
  FiltroDashboard,
  OrdenTopProductos,
  ResumenVentas,
  TopProducto,
  VentaCliente,
  VentaVendedor,
  VentasPeriodo,
} from '../../../core/models/dashboard.models';
import { etiquetaPeriodo } from '../../../core/utils/dashboard.utils';

@Component({
  selector: 'app-datos-venta',
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './datos-venta.html',
  styleUrl: './datos-venta.css',
})
export class DatosVenta implements OnInit {
  private readonly datosVentasService = inject(DatosVentasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formatoMoneda = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  readonly desde = signal('');
  readonly hasta = signal('');
  readonly agrupacion = signal<AgrupacionDashboard>('DIA');
  readonly ordenTop = signal<OrdenTopProductos>('UNIDADES');
  readonly rangoPredeterminado = computed(() => !this.desde() && !this.hasta());
  readonly errorRango = signal('');

  readonly resumen = signal<ResumenVentas | null>(null);
  readonly resumenCargando = signal(false);
  readonly resumenError = signal('');

  readonly periodos = signal<VentasPeriodo[] | null>(null);
  readonly periodosCargando = signal(false);
  readonly periodosError = signal('');

  readonly topProductos = signal<TopProducto[] | null>(null);
  readonly topProductosCargando = signal(false);
  readonly topProductosError = signal('');

  readonly ventasPorVendedor = signal<VentaVendedor[] | null>(null);
  readonly vendedoresCargando = signal(false);
  readonly vendedoresError = signal('');

  readonly ventasPorCliente = signal<VentaCliente[] | null>(null);
  readonly clientesCargando = signal(false);
  readonly clientesError = signal('');

  readonly periodoChartType: 'line' = 'line';
  readonly barrasChartType: 'bar' = 'bar';
  readonly periodoChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly productosChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly vendedoresChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  private chartColors = {
    primary: '',
    primaryLight: '',
    primaryDark: '',
    success: '',
    gray: '',
  };

  readonly periodoChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          title: (items) => {
            const row = this.periodos()?.[items[0]?.dataIndex ?? -1];
            return row
              ? `${etiquetaPeriodo(row.periodo, this.agrupacion())} · ${row.cantidadVentas} ventas`
              : '';
          },
          label: (context) =>
            `${context.dataset.label}: ${this.formatoMoneda.format(Number(context.raw ?? 0))}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatoMoneda.format(Number(value)),
        },
      },
    },
  };

  readonly productosChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => this.topProductos()?.[items[0]?.dataIndex ?? -1]?.nombre ?? '',
          label: (context) =>
            `${this.ordenTop() === 'UNIDADES' ? 'Unidades vendidas' : 'Monto vendido'}: ${
              this.ordenTop() === 'UNIDADES'
                ? context.raw
                : this.formatoMoneda.format(Number(context.raw ?? 0))
            }`,
          footer: (items) => {
            const product = this.topProductos()?.[items[0]?.dataIndex ?? -1];
            return product
              ? [
                  `Código: ${product.codigo}`,
                  `Unidades: ${product.unidadesVendidas}`,
                  `Monto bruto: ${this.formatoMoneda.format(product.montoBruto)}`,
                  `Descuentos: ${this.formatoMoneda.format(product.descuentos)}`,
                  `Monto vendido: ${this.formatoMoneda.format(product.montoVendido)}`,
                ]
              : [];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            this.ordenTop() === 'MONTO'
              ? this.formatoMoneda.format(Number(value))
              : String(value),
        },
      },
      y: { grid: { display: false } },
    },
  };

  readonly vendedoresChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            `Total vendido: ${this.formatoMoneda.format(Number(context.raw ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatoMoneda.format(Number(value)),
        },
      },
      y: { grid: { display: false } },
    },
  };

  ngOnInit(): void {
    this.chartColors = {
      primary: this.readCssColor('--crud-primary'),
      primaryLight: this.readCssColor('--crud-primary-light'),
      primaryDark: this.readCssColor('--crud-primary-dark'),
      success: this.readCssColor('--crud-success'),
      gray: this.readCssColor('--crud-gray-200'),
    };

    this.cargarResumen();
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

  cambiarOrdenTop(orden: OrdenTopProductos): void {
    if (this.ordenTop() === orden) {
      return;
    }

    this.ordenTop.set(orden);
    this.cargarTopProductos();
  }

  private cargarResumen(): void {
    this.cargarConEstado(
      this.datosVentasService.obtenerResumenVentas(),
      (datos) => this.resumen.set(datos),
      this.resumenCargando,
      this.resumenError,
    );
  }

  private cargarSeccionesFiltradas(): void {
    const filtro: FiltroDashboard = {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    this.cargarConEstado(
      this.datosVentasService.obtenerVentasPorPeriodo(filtro, this.agrupacion()),
      (datos) => {
        this.periodos.set(datos);
        this.actualizarGraficaPeriodos(datos);
      },
      this.periodosCargando,
      this.periodosError,
    );

    this.cargarTopProductos(filtro);

    this.cargarConEstado(
      this.datosVentasService.obtenerVentasPorVendedor(filtro),
      (datos) => {
        this.ventasPorVendedor.set(datos);
        this.actualizarGraficaVendedores(datos);
      },
      this.vendedoresCargando,
      this.vendedoresError,
    );

    this.cargarConEstado(
      this.datosVentasService.obtenerVentasPorCliente(filtro),
      (datos) => this.ventasPorCliente.set(datos),
      this.clientesCargando,
      this.clientesError,
    );
  }

  private cargarTopProductos(filtro?: FiltroDashboard): void {
    const filtros = filtro ?? {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
    };

    this.cargarConEstado(
      this.datosVentasService.obtenerTopProductos(filtros, this.ordenTop()),
      (datos) => {
        this.topProductos.set(datos);
        this.actualizarGraficaProductos(datos);
      },
      this.topProductosCargando,
      this.topProductosError,
    );
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

  private actualizarGraficaPeriodos(datos: VentasPeriodo[]): void {
    this.periodoChartData.set({
      labels: datos.map((item) => etiquetaPeriodo(item.periodo, this.agrupacion())),
      datasets: [
        {
          label: 'Ventas',
          data: datos.map((item) => item.totalVentas),
          borderColor: this.chartColors.primary,
          backgroundColor: this.chartColors.primary,
          pointBackgroundColor: this.chartColors.primary,
          tension: 0.25,
        },
        {
          label: 'Descuentos',
          data: datos.map((item) => item.descuentoTotal),
          borderColor: this.chartColors.primaryLight,
          backgroundColor: this.chartColors.primaryLight,
          pointBackgroundColor: this.chartColors.primaryLight,
          tension: 0.25,
        },
      ],
    });
  }

  private actualizarGraficaProductos(datos: TopProducto[]): void {
    this.productosChartData.set({
      labels: datos.map((item) => item.nombre),
      datasets: [
        {
          label: this.ordenTop() === 'UNIDADES' ? 'Unidades vendidas' : 'Monto vendido',
          data: datos.map((item) =>
            this.ordenTop() === 'UNIDADES' ? item.unidadesVendidas : item.montoVendido,
          ),
          backgroundColor: datos.map((_, index) =>
            index % 2 === 0 ? this.chartColors.primary : this.chartColors.primaryLight,
          ),
          borderColor: this.chartColors.primaryDark,
          borderWidth: 1,
        },
      ],
    });
  }

  private actualizarGraficaVendedores(datos: VentaVendedor[]): void {
    this.vendedoresChartData.set({
      labels: datos.map((item) => item.vendedor),
      datasets: [
        {
          label: 'Total vendido',
          data: datos.map((item) => item.totalVendido),
          backgroundColor: this.chartColors.success,
          borderColor: this.chartColors.primaryDark,
          borderWidth: 1,
        },
      ],
    });
  }

  private mensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrió un error inesperado al cargar esta sección.';
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
