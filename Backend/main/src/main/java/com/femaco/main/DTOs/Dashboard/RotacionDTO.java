package com.femaco.main.DTOs.Dashboard;

import static com.femaco.main.DTOs.Dashboard.Montos.nz;

import java.math.BigDecimal;

public record RotacionDTO(
        Long idArticulo,
        String codigo,
        String nombre,
        BigDecimal stockActual,
        BigDecimal totalSalidas,
        BigDecimal totalEntradas,
        BigDecimal ajusteNeto,          // suma de (stockNuevo - stockViejo) de los ajustes
        long cantidadMovimientos) {

    private static final String SALIDA = "salida";
    private static final String ENTRADA = "entrada";
    private static final String AJUSTE = "ajuste";

    public static RotacionDTO de(RotacionFilaDTO f) {
        BigDecimal cantidad = nz(f.cantidad());
        String tipo = f.tipoMovimiento();
        return new RotacionDTO(
                f.idArticulo(), f.codigo(), f.nombre(), nz(f.stockActual()),
                SALIDA.equalsIgnoreCase(tipo) ? cantidad : BigDecimal.ZERO,
                ENTRADA.equalsIgnoreCase(tipo) ? cantidad : BigDecimal.ZERO,
                AJUSTE.equalsIgnoreCase(tipo) ? nz(f.variacionNeta()) : BigDecimal.ZERO,
                nz(f.cantidadMovimientos()));
    }

    public RotacionDTO sumar(RotacionDTO o) {
        return new RotacionDTO(idArticulo, codigo, nombre, stockActual,
                totalSalidas.add(o.totalSalidas),
                totalEntradas.add(o.totalEntradas),
                ajusteNeto.add(o.ajusteNeto),
                cantidadMovimientos + o.cantidadMovimientos);
    }
}
