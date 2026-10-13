package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;

/** Fila intermedia: una por (artículo, tipo de movimiento). El servicio la pivotea a RotacionDTO. */
public record RotacionFilaDTO(
        Long idArticulo,
        String codigo,
        String nombre,
        BigDecimal stockActual,
        String tipoMovimiento,      // null si el artículo no tuvo movimientos en el rango
        Long cantidadMovimientos,
        BigDecimal cantidad,
        BigDecimal variacionNeta) {
}
