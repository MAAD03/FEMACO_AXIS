import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
    AgrupacionDashboard,
    FiltroDashboard,
    HistorialMovimiento,
    MovimientoPeriodo,
    OrdenRotacion,
    Pagina,
    Rotacion,
    StockBajo,
} from '../models/dashboard.models';
import { construirParams } from '../utils/dashboard.utils';

@Injectable({
    providedIn: 'root',
})
export class DatosArticulosService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);
    private readonly dashboardInventarioUrl = `${this.baseUrl}/dashboard/inventario`;

    obtenerStockBajo(): Observable<StockBajo[]> {
        return this.http.get<StockBajo[]>(`${this.dashboardInventarioUrl}/stock-bajo`);
    }

    obtenerMovimientosPorPeriodo(
        filtro: FiltroDashboard,
        agrupacion: AgrupacionDashboard = 'DIA'
    ): Observable<MovimientoPeriodo[]> {
        return this.http.get<MovimientoPeriodo[]>(`${this.dashboardInventarioUrl}/movimientos`, {
            params: construirParams({ ...filtro, agrupacion }),
        });
    }

    obtenerHistorialArticulo(
        idArticulo: number,
        pagina = 0,
        tamanio?: number
    ): Observable<Pagina<HistorialMovimiento>> {
        return this.http.get<Pagina<HistorialMovimiento>>(
            `${this.dashboardInventarioUrl}/articulos/${idArticulo}/movimientos`,
            { params: construirParams({ pagina, tamanio }) },
        );
    }

    obtenerRotacion(
        filtro: FiltroDashboard,
        orden: OrdenRotacion = 'MAS_MOVIDOS',
        limite?: number
    ): Observable<Rotacion[]> {
        return this.http.get<Rotacion[]>(`${this.dashboardInventarioUrl}/rotacion`, {
            params: construirParams({ ...filtro, orden, limite }),
        });
    }
}