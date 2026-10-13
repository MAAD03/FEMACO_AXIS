package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HistorialMovimientoDTO(
        Long idMovimientoInventario,
        String tipoMovimiento,
        String motivo,
        BigDecimal cantidad,
        BigDecimal stockViejo,
        BigDecimal stockNuevo,
        LocalDateTime fecha,
        String usuario) {
}
