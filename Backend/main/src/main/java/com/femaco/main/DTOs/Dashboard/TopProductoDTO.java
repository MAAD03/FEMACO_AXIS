package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;

public record TopProductoDTO(
        Long idArticulo,
        String codigo,
        String nombre,
        BigDecimal unidadesVendidas,
        BigDecimal montoBruto,
        BigDecimal descuentos,
        BigDecimal montoVendido) {
}
