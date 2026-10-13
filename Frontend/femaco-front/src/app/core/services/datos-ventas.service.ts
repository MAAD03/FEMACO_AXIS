import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
    AgrupacionDashboard,
    FiltroDashboard,
    OrdenTopProductos,
    ResumenVentas,
    TopProducto,
    VentaCliente,
    VentaVendedor,
    VentasPeriodo,
} from '../models/dashboard.models';
import { construirParams } from '../utils/dashboard.utils';

@Injectable({
    providedIn: 'root',
})
export class DatosVentasService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);
    private readonly dashboardVentasUrl = `${this.baseUrl}/dashboard/ventas`;

    obtenerVentasPorPeriodo(
        filtro: FiltroDashboard,
        agrupacion: AgrupacionDashboard = 'DIA'
    ): Observable<VentasPeriodo[]> {
        return this.http.get<VentasPeriodo[]>(`${this.dashboardVentasUrl}/por-periodo`, {
            params: construirParams({ ...filtro, agrupacion }),
        });
    }

    obtenerResumenVentas(): Observable<ResumenVentas> {
        return this.http.get<ResumenVentas>(`${this.dashboardVentasUrl}/resumen`);
    }

    obtenerTopProductos(
        filtro: FiltroDashboard,
        orden: OrdenTopProductos = 'UNIDADES',
        limite?: number
    ): Observable<TopProducto[]> {
        return this.http.get<TopProducto[]>(`${this.dashboardVentasUrl}/top-productos`, {
            params: construirParams({ ...filtro, orden, limite }),
        });
    }

    obtenerVentasPorCliente(filtro: FiltroDashboard, limite?: number): Observable<VentaCliente[]> {
        return this.http.get<VentaCliente[]>(`${this.dashboardVentasUrl}/por-cliente`, {
            params: construirParams({ ...filtro, limite }),
        });
    }

    obtenerVentasPorVendedor(filtro: FiltroDashboard): Observable<VentaVendedor[]> {
        return this.http.get<VentaVendedor[]>(`${this.dashboardVentasUrl}/por-vendedor`, {
            params: construirParams({ ...filtro }),
        });
    }
}