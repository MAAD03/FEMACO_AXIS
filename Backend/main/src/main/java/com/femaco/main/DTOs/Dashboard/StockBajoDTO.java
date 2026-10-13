package com.femaco.main.DTOs.Dashboard;

import static com.femaco.main.DTOs.Dashboard.Montos.nz;

import java.math.BigDecimal;

public record StockBajoDTO(
        Long idArticulo,
        String codigo,
        String nombre,
        BigDecimal stockActual,
        BigDecimal stockMinimo,
        BigDecimal faltante) {

    /** Constructor usado por el JPQL: calcula el faltante; stockActual nulo se trata como 0. */
    public StockBajoDTO(Long idArticulo, String codigo, String nombre,
                        BigDecimal stockActual, BigDecimal stockMinimo) {
        this(idArticulo, codigo, nombre, nz(stockActual), nz(stockMinimo),
                nz(stockMinimo).subtract(nz(stockActual)));
    }
}
