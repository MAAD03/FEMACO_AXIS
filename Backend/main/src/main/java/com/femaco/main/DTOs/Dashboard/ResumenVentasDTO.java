package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ResumenVentasDTO(
        LocalDate fechaReferencia,
        PeriodoResumenDTO hoy,
        PeriodoResumenDTO ayer,
        PeriodoResumenDTO mesActual,
        PeriodoResumenDTO mesAnteriorMismoPeriodo,
        PeriodoResumenDTO mesAnteriorCompleto,
        BigDecimal variacionVsAyerPct,      // null si ayer no hubo ventas
        BigDecimal variacionMensualPct) {   // mes actual vs mismo tramo del mes anterior
}
