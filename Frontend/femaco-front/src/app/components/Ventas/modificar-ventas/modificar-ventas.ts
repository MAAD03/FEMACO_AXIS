import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { concatMap, forkJoin, from, map, of, switchMap, tap, toArray } from 'rxjs';
import { AreaArticulo as AreaArticuloModel } from '../../../core/models/area-articulo.model';
import { Articulo, ArticuloFiltro } from '../../../core/models/articulo.model';
import { MetodoPago, Venta } from '../../../core/models/venta.model';
import { VentaDetalle } from '../../../core/models/venta-detalle.model';
import { UnidadMedida as UnidadMedidaModel } from '../../../core/models/unidad-medida.model';
import { AreaArticuloNombrePipe } from '../../../core/pipes/area-articulo-nombre-pipe';
import { ClienteNombrePipe } from '../../../core/pipes/cliente-nombre-pipe';
import { UnidadMedidaAbreviaturaPipe } from '../../../core/pipes/unidad-medida-abreviatura-pipe';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';
import {
  VentaConDetalles,
  VentaDetalleModificarRequest,
  VentaModificarRequest,
  VentaService,
} from '../../../core/services/venta.service';

interface DetalleVentaEditable {
  idArticulo: number;
  idVentaDetalle?: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  stockActual: number;
  cantidad: number;
  cantidadOriginal: number;
  precioUnitario: number;
  porcDescuentoMayorista: number;
  montoDescuentoMayorista: number;
  porcDescuentoManual: number;
  porcDescuentoManualOriginal: number;
  montoDescuentoManual: number;
  subtotalBruto: number;
  subtotal: number;
  cantidadMinimaDescuento: number;
  descuentoMayoristaArticulo: number;
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
  selector: 'app-modificar-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AreaArticuloNombrePipe, ClienteNombrePipe, UnidadMedidaAbreviaturaPipe],
  styleUrl: '../ventas/ventas.css',
  templateUrl: './modificar-ventas.html',
})
export class ModificarVentas implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly articuloService = inject(ArticuloService);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  busquedaForm!: FormGroup;
  pagoForm!: FormGroup;
  filtrosForm!: FormGroup;
  articulos = signal<Articulo[]>([]);
  areas = signal<AreaArticuloModel[]>([]);
  unidades = signal<UnidadMedidaModel[]>([]);
  catalogoArticulos = signal<Articulo[] | null>(null);
  items = signal<DetalleVentaEditable[]>([]);
  ventaActual = signal<VentaConDetalles | null>(null);
  buscandoVenta = signal(false);
  buscandoArticulos = signal(false);
  modificando = signal(false);
  generandoComprobante = signal(false);
  mostrandoFormularioPago = signal(false);
  actualizandoPago = signal(false);
  pagoActualizado = signal(false);
  modificacionCompletada = signal(false);
  mensaje = signal('');
  error = signal('');
  errorComprobante = signal('');
  errorPago = signal('');
  mensajePago = signal('');
  private pagoCloseTimeout: number | null = null;
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  readonly tamanosPagina = [6, 9, 12, 18, 24];
  readonly metodosPago: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'CHEQUE', 'TRANSFERENCIA', 'DEPOSITO'];

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('ventas');
  }

  get puedeCambiar(): boolean {
    return this.permisos.cambio;
  }

  get puedeAplicarDescuento(): boolean {
    const usuario = this.authService.getCurrentUser() as (Record<string, unknown> | null);
    return usuario?.['PuedeAplicarDescuento'] === true;
  }

  get puedeGuardarCambios(): boolean {
    return this.puedeCambiar && this.hayCambios && !this.modificando();
  }

  get hayCambios(): boolean {
    return this.items().some(item =>
      item.idVentaDetalle == null
        ? item.cantidad > 0
        : item.cantidad !== item.cantidadOriginal
          || item.porcDescuentoManual !== item.porcDescuentoManualOriginal
    );
  }

  get subtotal(): number {
    return sumMoney(this.items().map(item => item.subtotalBruto));
  }

  get descuentoMayoristaTotal(): number {
    return sumMoney(this.items().map(item => item.montoDescuentoMayorista));
  }

  get descuentoManualTotal(): number {
    return sumMoney(this.items().map(item => item.montoDescuentoManual));
  }

  get total(): number {
    return sumMoney(this.items().map(item => item.subtotal));
  }

  get tamanoControl(): FormControl {
    return this.filtrosForm.get('size') as FormControl;
  }

  ngOnInit(): void {
    this.busquedaForm = this.fb.group({
      idVenta: [null, [Validators.required, Validators.min(1)]],
    });
    this.pagoForm = this.fb.group({
      metodoPago: this.fb.control<MetodoPago | null>(null, Validators.required),
      referenciaPago: this.fb.control('', Validators.maxLength(45)),
    });
    this.filtrosForm = this.fb.group({
      q: [''], idArea: [null], idUnidad: [null], stockMin: [null], stockMax: [null],
      precioMin: [null], precioMax: [null], stockBajo: [false], sinStock: [false], size: [9],
    });
    this.areaArticuloService.buscarTodos().subscribe({ next: data => this.areas.set(data ?? []) });
    this.unidadMedidaService.buscarTodos().subscribe({ next: data => this.unidades.set(data ?? []) });
    this.cargarListaArticulos();
  }

  buscarVenta(): void {
    if (this.busquedaForm.invalid || this.buscandoVenta() || this.modificando()) {
      this.busquedaForm.markAllAsTouched();
      return;
    }

    if (this.ventaActual() && this.hayCambios
      && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos y buscar otra venta?')) return;

    const idVenta = Number(this.busquedaForm.value.idVenta);
    this.buscandoVenta.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.modificacionCompletada.set(false);

    this.ventaService.buscarPorId(idVenta).pipe(
      switchMap(venta => this.cargarArticulosVenta(venta)),
    ).subscribe({
      next: venta => {
        this.ventaActual.set(venta);
        this.items.set(this.crearItems(venta.detalles ?? []));
        this.buscandoVenta.set(false);
      },
      error: error => {
        this.error.set(error?.error?.message || error?.error?.mensaje || 'No se pudo cargar la venta o el stock de sus artículos');
        this.buscandoVenta.set(false);
      },
    });
  }

  private crearItems(detalles: VentaDetalle[]): DetalleVentaEditable[] {
    const catalogo = new Map((this.catalogoArticulos() ?? [])
      .filter(articulo => articulo.idArticulo != null)
      .map(articulo => [articulo.idArticulo!, articulo]));

    return detalles
      .filter((detalle): detalle is VentaDetalle & { idArticulo: number } => detalle.idArticulo != null)
      .map(detalle => {
        const articulo = catalogo.get(detalle.idArticulo);
        const cantidad = Number(detalle.cantidad) || 0;
        const porcDescuentoManual = Number(detalle.porcDescuentoManual) || 0;
        return this.recalcular({
          idArticulo: detalle.idArticulo,
          idVentaDetalle: detalle.idVentaDetalle,
          codigo: articulo?.codigo,
          nombre: articulo?.nombre || this.articuloService.getNombreById(detalle.idArticulo),
          descripcion: articulo?.descripcion,
          stockActual: Number(articulo?.stockActual ?? 0),
          cantidad,
          cantidadOriginal: cantidad,
          precioUnitario: Number(detalle.precioUnitario) || 0,
          porcDescuentoMayorista: Number(detalle.porcDescuentoMayorista) || 0,
          montoDescuentoMayorista: Number(detalle.montoDescuentoMayorista) || 0,
          porcDescuentoManual,
          porcDescuentoManualOriginal: porcDescuentoManual,
          montoDescuentoManual: Number(detalle.montoDescuentoManual) || 0,
          subtotalBruto: Number(detalle.subtotalBruto) || 0,
          subtotal: Number(detalle.subtotal) || 0,
          cantidadMinimaDescuento: Number(articulo?.cantidadMinimaDescuento ?? 0),
          descuentoMayoristaArticulo: Number(articulo?.descuentoMayorista ?? detalle.porcDescuentoMayorista ?? 0),
        });
      });
  }

  private cargarArticulosVenta(venta: VentaConDetalles) {
    const idsArticulo = [...new Set(
      (venta.detalles ?? [])
        .map(detalle => detalle.idArticulo)
        .filter((idArticulo): idArticulo is number => idArticulo != null),
    )];
    if (!idsArticulo.length) return of(venta);

    return forkJoin(idsArticulo.map(idArticulo =>
      this.articuloService.buscarPaginado({ q: String(idArticulo) }, 0, 20, 'nombre,asc').pipe(
        map(pagina => pagina.content?.find(articulo => articulo.idArticulo === idArticulo)),
      ),
    )).pipe(
      map(articulos => articulos.filter((articulo): articulo is Articulo => articulo != null)),
      tap(articulos => this.catalogoArticulos.update(catalogo => [
        ...(catalogo ?? []).filter(actual => !articulos.some(articulo => articulo.idArticulo === actual.idArticulo)),
        ...articulos,
      ])),
      map(() => venta),
    );
  }

  buscarArticulos(): void {
    this.paginaActual.set(0);
    this.cargarListaArticulos();
  }

  private cargarListaArticulos(): void {
    this.buscandoArticulos.set(true);
    this.articuloService.buscarPaginado(
      { ...this.obtenerFiltros(), idEstado: 1 },
      this.paginaActual(),
      this.obtenerTamano(),
      'nombre,asc',
    ).subscribe({
      next: pagina => {
        this.articulos.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? this.paginaActual());
        this.buscandoArticulos.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los artículos activos');
        this.buscandoArticulos.set(false);
      },
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      q: '', idArea: null, idUnidad: null, stockMin: null, stockMax: null,
      precioMin: null, precioMax: null, stockBajo: false, sinStock: false, size: 9,
    });
    this.paginaActual.set(0);
    this.cargarListaArticulos();
  }

  cambiarTamano(): void {
    this.paginaActual.set(0);
    this.cargarListaArticulos();
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarListaArticulos();
  }

  agregarArticulo(articulo: Articulo): void {
    const idArticulo = articulo.idArticulo;
    if (idArticulo == null || !this.puedeCambiar || !this.ventaActual()) return;
    const existente = this.items().findIndex(item => item.idArticulo === idArticulo);
    if (existente >= 0) {
      this.actualizarCantidad(existente, this.items()[existente].cantidad + 1);
      return;
    }

    const precioUnitario = this.calcularPrecioVenta(
      Number(articulo.precioCompraUltimoProveedor ?? 0),
      Number(articulo.margenGanancia ?? 0),
    );
    const cantidadMinimaDescuento = Number(articulo.cantidadMinimaDescuento ?? 0);
    const descuentoMayoristaArticulo = Number(articulo.descuentoMayorista ?? 0);
    this.items.update(items => [...items, this.recalcular({
      idArticulo,
      codigo: articulo.codigo,
      nombre: articulo.nombre,
      descripcion: articulo.descripcion,
      stockActual: Number(articulo.stockActual ?? 0),
      cantidad: 1,
      cantidadOriginal: 0,
      precioUnitario,
      porcDescuentoMayorista: 0,
      montoDescuentoMayorista: 0,
      porcDescuentoManual: 0,
      porcDescuentoManualOriginal: 0,
      montoDescuentoManual: 0,
      subtotalBruto: 0,
      subtotal: 0,
      cantidadMinimaDescuento,
      descuentoMayoristaArticulo,
    })]);
  }

  actualizarCantidad(index: number, cantidad: number): void {
    if (!this.puedeCambiar || this.modificando()) return;
    this.actualizarItem(index, { cantidad: this.normalizarNumero(cantidad) });
  }

  limitarDescuentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = Number(input.value);
    if (Number.isFinite(valor) && valor > 100) input.value = '100';
  }

  actualizarDescuentoManual(index: number, descuento: number): void {
    if (!this.puedeCambiar || !this.puedeAplicarDescuento || this.modificando()) return;
    this.actualizarItem(index, { porcDescuentoManual: this.normalizarDescuento(descuento) });
  }

  private actualizarItem(index: number, cambios: Partial<DetalleVentaEditable>): void {
    this.items.update(items => items.map((item, itemIndex) =>
      itemIndex === index ? this.recalcular({ ...item, ...cambios }) : item
    ));
  }

  private recalcular(item: DetalleVentaEditable): DetalleVentaEditable {
    const cantidad = Math.max(0, Number(item.cantidad) || 0);
    const precioUnitario = Number(item.precioUnitario) || 0;
    const bruto = roundMoney(multiplyDecimals(decimal(cantidad), decimal(precioUnitario)));
    const aplicaMayorista = item.cantidadMinimaDescuento > 0 && cantidad >= item.cantidadMinimaDescuento;
    const porcMayorista = aplicaMayorista
      ? Math.min(100, Math.max(0, Number(item.descuentoMayoristaArticulo) || 0))
      : 0;
    const montoMayorista = roundMoney(
      multiplyDecimals(decimal(bruto), divideDecimalByHundred(decimal(porcMayorista))),
    );
    const porcManualMaximo = 100 - porcMayorista;
    const porcManual = this.puedeAplicarDescuento
      ? Math.min(porcManualMaximo, Math.max(0, Number(item.porcDescuentoManual) || 0))
      : item.idVentaDetalle == null
        ? 0
        : Math.max(0, Number(item.porcDescuentoManual) || 0);
    const montoManual = roundMoney(
      multiplyDecimals(decimal(bruto), divideDecimalByHundred(decimal(porcManual))),
    );
    const subtotalCents = moneyCents(bruto) - moneyCents(montoMayorista) - moneyCents(montoManual);
    const subtotal = Number(roundUpToNickel(subtotalCents)) / 100;
    return {
      ...item,
      cantidad,
      precioUnitario,
      porcDescuentoMayorista: porcMayorista,
      porcDescuentoManual: porcManual,
      subtotalBruto: bruto,
      montoDescuentoMayorista: montoMayorista,
      montoDescuentoManual: montoManual,
      subtotal,
    };
  }

  calcularPrecioVenta(precioCompra: number, margen: number): number {
    const costo = decimal(precioCompra);
    const incremento = divideDecimalByHundred(multiplyDecimals(costo, decimal(margen)));
    return roundMoney(addDecimals(costo, incremento));
  }

  quitarArticulo(index: number): void {
    if (!this.puedeCambiar || this.modificando()) return;
    const item = this.items()[index];
    if (!item) return;
    if (item.idVentaDetalle == null) {
      this.items.update(items => items.filter((_, itemIndex) => itemIndex !== index));
      return;
    }
    this.actualizarCantidad(index, 0);
  }

  guardarModificacion(): void {
    const venta = this.ventaActual();
    if (!this.puedeCambiar) {
      this.error.set('No tienes permiso para modificar ventas');
      return;
    }
    if (venta?.venta.idVenta == null || this.modificando()) return;

    const cambios = this.obtenerCambios();
    if (!cambios.length) {
      this.mensaje.set('No hay cambios para guardar');
      return;
    }
    if (this.items().some(item => item.subtotal < 0)) {
      this.error.set('Los descuentos no pueden ser mayores que el subtotal');
      return;
    }
    if (!window.confirm(`¿Desea guardar los cambios de la venta ${venta.venta.idVenta}?`)) return;

    const idVenta = venta.venta.idVenta;
    let peticionesCompletadas = 0;
    let ultimaVenta: Venta | null = null;
    this.modificando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.ventaService.modificarConDetalle(idVenta, cambios[0]).pipe(
      tap(respuesta => {
        peticionesCompletadas++;
        ultimaVenta = respuesta;
      }),
    );

    from(cambios).pipe(
      concatMap(dto => this.ventaService.modificarConDetalle(idVenta, dto).pipe(
        tap(respuesta => {
          peticionesCompletadas++;
          ultimaVenta = respuesta;
        }),
      )),
      toArray(),
      switchMap(() => this.ventaService.buscarPorId(idVenta)),
      switchMap(ventaActualizada => this.cargarArticulosVenta(ventaActualizada)),
    ).subscribe({
      next: ventaActualizada => {
        this.ventaActual.set(ventaActualizada);
        this.items.set(this.crearItems(ventaActualizada.detalles ?? []));
        this.modificacionCompletada.set(true);
        this.mensaje.set('Venta actualizada exitosamente');
        this.modificando.set(false);
      },
      error: error => {
        const detalleError = error?.error?.message || error?.error?.mensaje || 'Error al modificar la venta';
        if (peticionesCompletadas === cambios.length) {
          if (ultimaVenta && this.ventaActual()) {
            this.ventaActual.update(actual => actual ? { ...actual, venta: ultimaVenta! } : actual);
          }
          this.items.update(items => items.map(item => ({
            ...item,
            cantidadOriginal: item.cantidad,
            porcDescuentoManualOriginal: item.porcDescuentoManual,
          })));
          this.modificacionCompletada.set(true);
          this.mensaje.set('Venta actualizada exitosamente, pero no se pudieron recargar sus detalles');
          this.error.set(detalleError);
          this.modificando.set(false);
          return;
        }

        this.recargarTrasError(idVenta, detalleError, peticionesCompletadas);
      },
    });
  }

  private obtenerCambios(): VentaModificarRequest[] {
    const cambios: VentaModificarRequest[] = [];
    for (const item of this.items()) {
      if (item.idVentaDetalle == null) {
        if (item.cantidad > 0) {
          cambios.push({
            detalle: {
              idArticulo: item.idArticulo,
              cantidad: item.cantidad,
              porcDescuentoManual: item.porcDescuentoManual,
            },
          });
        }
        continue;
      }

      const cantidadCambio = item.cantidad !== item.cantidadOriginal;
      const descuentoCambio = item.porcDescuentoManual !== item.porcDescuentoManualOriginal;
      if (!cantidadCambio && !descuentoCambio) continue;

      const detalle: VentaDetalleModificarRequest = {
        idVentaDetalle: item.idVentaDetalle,
        cantidad: item.cantidad,
      };
      if (descuentoCambio) detalle.porcDescuentoManual = item.porcDescuentoManual;
      cambios.push({ detalle });
    }
    return cambios;
  }

  private recargarTrasError(idVenta: number, detalleError: string, aplicadas: number): void {
    this.ventaService.buscarPorId(idVenta).pipe(
      switchMap(ventaActualizada => this.cargarArticulosVenta(ventaActualizada)),
    ).subscribe({
      next: ventaActualizada => {
        this.ventaActual.set(ventaActualizada);
        this.items.set(this.crearItems(ventaActualizada.detalles ?? []));
        this.error.set(
          `No se completaron todos los cambios. Se aplicaron ${aplicadas} de las solicitudes antes del error. ${detalleError}`,
        );
        this.modificando.set(false);
      },
      error: error => {
        const errorRecarga = error?.error?.message || error?.error?.mensaje || 'No se pudo recargar la venta';
        this.error.set(
          `La actualización quedó incompleta (${aplicadas} solicitudes completadas) y tampoco se pudo recargar la venta. ${detalleError}. ${errorRecarga}`,
        );
        this.modificando.set(false);
      },
    });
  }

  abrirFormularioPago(): void {
    const venta = this.ventaActual()?.venta;
    if (!this.puedeCambiar || venta?.idVenta == null || this.actualizandoPago()) return;
    this.cancelarCierrePago();
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
    this.cancelarCierrePago();
    this.mostrandoFormularioPago.set(false);
    this.errorPago.set('');
    this.mensajePago.set('');
    this.pagoActualizado.set(false);
  }

  actualizarPago(): void {
    const venta = this.ventaActual()?.venta;
    if (!this.puedeCambiar || venta?.idVenta == null || this.actualizandoPago() || this.pagoActualizado()) return;
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
      referenciaPago: referenciaPago?.trim() || null,
    }).subscribe({
      next: ventaActualizada => {
        this.ventaActual.update(actual => actual ? { ...actual, venta: ventaActualizada } : actual);
        this.actualizandoPago.set(false);
        this.pagoActualizado.set(true);
        this.mensajePago.set('Método de pago actualizado correctamente');
        this.pagoCloseTimeout = window.setTimeout(() => this.cerrarFormularioPago(), 3000);
      },
      error: error => {
        this.errorPago.set(error?.error?.message || error?.error?.mensaje || 'Error al actualizar el método de pago');
        this.actualizandoPago.set(false);
        this.pagoForm.enable();
      },
    });
  }

  private cancelarCierrePago(): void {
    if (this.pagoCloseTimeout == null) return;
    window.clearTimeout(this.pagoCloseTimeout);
    this.pagoCloseTimeout = null;
  }

  cerrarVentaActualizada(): void {
    if (this.buscandoVenta() || this.modificando() || this.actualizandoPago() || this.generandoComprobante()) return;
    if (!window.confirm('¿Está segura de que desea cerrar la venta actualizada y limpiar el formulario?')) return;

    this.cancelarCierrePago();
    this.busquedaForm.reset({ idVenta: null });
    this.ventaActual.set(null);
    this.items.set([]);
    this.modificacionCompletada.set(false);
    this.mostrandoFormularioPago.set(false);
    this.pagoForm.enable();
    this.pagoForm.reset({ metodoPago: null, referenciaPago: '' });
    this.pagoActualizado.set(false);
    this.error.set('');
    this.mensaje.set('');
    this.errorComprobante.set('');
    this.errorPago.set('');
    this.mensajePago.set('');
  }

  generarComprobante(): void {
    const idVenta = this.ventaActual()?.venta.idVenta;
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

  private obtenerFiltros(): ArticuloFiltro {
    const value = this.filtrosForm.value;
    const numero = (dato: unknown): number | undefined => dato === null || dato === '' ? undefined : Number(dato);
    return {
      q: value.q?.trim() || undefined,
      idArea: numero(value.idArea),
      idUnidad: numero(value.idUnidad),
      stockMin: numero(value.stockMin),
      stockMax: numero(value.stockMax),
      precioMin: numero(value.precioMin),
      precioMax: numero(value.precioMax),
      stockBajo: value.stockBajo === true,
      sinStock: value.sinStock === true,
    };
  }

  private obtenerTamano(): number {
    return Number(this.filtrosForm.value.size) || 9;
  }

  private normalizarNumero(value: number): number {
    return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  }

  private normalizarDescuento(value: number): number {
    return Math.min(100, this.normalizarNumero(value));
  }
}
