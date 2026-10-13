package com.femaco.main.DTOs.Dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Utilidades numéricas del dashboard. */
public final class Montos {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private Montos() {
    }

    /** null → 0 (SUM devuelve null cuando no hay filas). */
    public static BigDecimal nz(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    public static long nz(Long valor) {
        return valor == null ? 0L : valor;
    }

    public static BigDecimal promedio(BigDecimal total, long cantidad) {
        if (cantidad == 0) {
            return BigDecimal.ZERO;
        }
        return nz(total).divide(BigDecimal.valueOf(cantidad), 2, RoundingMode.HALF_UP);
    }

    /** % de variación de actual vs anterior; null si anterior es 0 (no se puede calcular). */
    public static BigDecimal variacionPorcentual(BigDecimal actual, BigDecimal anterior) {
        if (anterior == null || anterior.signum() == 0) {
            return null;
        }
        return nz(actual).subtract(anterior)
                .multiply(CIEN)
                .divide(anterior, 2, RoundingMode.HALF_UP);
    }

    /** Aplica valor por defecto y lo limita a [1, maximo]. */
    public static int limitar(Integer solicitado, int porDefecto, int maximo) {
        int valor = solicitado == null ? porDefecto : solicitado;
        return Math.max(1, Math.min(valor, maximo));
    }
}
