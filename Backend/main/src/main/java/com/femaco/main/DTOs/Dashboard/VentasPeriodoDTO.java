package com.femaco.main.DTOs.Dashboard;

import static com.femaco.main.DTOs.Dashboard.Montos.nz;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Totales de ventas de un período (día, semana o mes). */
public record VentasPeriodoDTO(
        LocalDate periodo,
        Long cantidadVentas,
        BigDecimal subtotal,
        BigDecimal descuentoMayorista,
        BigDecimal descuentoManual,
        BigDecimal descuentoTotal,
        BigDecimal totalVentas) {

    public VentasPeriodoDTO {
        cantidadVentas = nz(cantidadVentas);
        subtotal = nz(subtotal);
        descuentoMayorista = nz(descuentoMayorista);
        descuentoManual = nz(descuentoManual);
        descuentoTotal = nz(descuentoTotal);
        totalVentas = nz(totalVentas);
    }

    public static VentasPeriodoDTO vacio(LocalDate periodo) {
        return new VentasPeriodoDTO(periodo, 0L, null, null, null, null, null);
    }

    public VentasPeriodoDTO conPeriodo(LocalDate nuevoPeriodo) {
        return new VentasPeriodoDTO(nuevoPeriodo, cantidadVentas, subtotal, descuentoMayorista,
                descuentoManual, descuentoTotal, totalVentas);
    }

    /** Suma otro registro manteniendo el período de este. */
    public VentasPeriodoDTO sumar(VentasPeriodoDTO o) {
        return new VentasPeriodoDTO(periodo,
                cantidadVentas + o.cantidadVentas,
                subtotal.add(o.subtotal),
                descuentoMayorista.add(o.descuentoMayorista),
                descuentoManual.add(o.descuentoManual),
                descuentoTotal.add(o.descuentoTotal),
                totalVentas.add(o.totalVentas));
    }
}
