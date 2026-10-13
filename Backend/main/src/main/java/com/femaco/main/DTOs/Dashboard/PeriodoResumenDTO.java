package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PeriodoResumenDTO(
        LocalDate desde,
        LocalDate hasta,
        long cantidadVentas,
        BigDecimal total,
        BigDecimal descuentos,
        BigDecimal ticketPromedio) {

    public static PeriodoResumenDTO de(LocalDate desde, LocalDate hasta, TotalesVentaDTO t) {
        return new PeriodoResumenDTO(desde, hasta, t.cantidadVentas(), t.total(), t.descuentos(),
                Montos.promedio(t.total(), t.cantidadVentas()));
    }
}
