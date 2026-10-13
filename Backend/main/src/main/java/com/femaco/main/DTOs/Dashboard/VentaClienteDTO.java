package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;

public record VentaClienteDTO(
        Long idCliente,
        String nombre,
        String nit,
        Long cantidadCompras,
        BigDecimal totalComprado,
        BigDecimal descuentosRecibidos) {
}
