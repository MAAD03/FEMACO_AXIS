package com.femaco.main.DTOs.Dashboard;

import static com.femaco.main.DTOs.Dashboard.Montos.nz;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MovimientoPeriodoDTO(
        LocalDate periodo,
        String tipoMovimiento,
        String motivo,
        Long cantidadMovimientos,
        BigDecimal cantidadTotal,
        BigDecimal variacionNeta) {   // SUM(stockNuevo - stockViejo): positivo = subió el stock

    public MovimientoPeriodoDTO {
        cantidadMovimientos = nz(cantidadMovimientos);
        cantidadTotal = nz(cantidadTotal);
        variacionNeta = nz(variacionNeta);
    }

    public MovimientoPeriodoDTO conPeriodo(LocalDate nuevoPeriodo) {
        return new MovimientoPeriodoDTO(nuevoPeriodo, tipoMovimiento, motivo,
                cantidadMovimientos, cantidadTotal, variacionNeta);
    }

    public MovimientoPeriodoDTO sumar(MovimientoPeriodoDTO o) {
        return new MovimientoPeriodoDTO(periodo, tipoMovimiento, motivo,
                cantidadMovimientos + o.cantidadMovimientos,
                cantidadTotal.add(o.cantidadTotal),
                variacionNeta.add(o.variacionNeta));
    }
}
