package com.femaco.main.DTOs.Dashboard;

import static com.femaco.main.DTOs.Dashboard.Montos.nz;

import java.math.BigDecimal;

/** Totales de ventas en un rango (uso interno del resumen). */
public record TotalesVentaDTO(Long cantidadVentas, BigDecimal total, BigDecimal descuentos) {

    public TotalesVentaDTO {
        cantidadVentas = nz(cantidadVentas);
        total = nz(total);
        descuentos = nz(descuentos);
    }
}
