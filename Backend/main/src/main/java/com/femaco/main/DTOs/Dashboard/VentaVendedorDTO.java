package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;

public record VentaVendedorDTO(
        Long idUsuario,
        String vendedor,
        Long cantidadVentas,
        BigDecimal totalVendido,
        BigDecimal descuentosAplicados) {
}
