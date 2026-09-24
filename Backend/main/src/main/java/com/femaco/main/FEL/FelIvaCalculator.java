package com.femaco.main.FEL;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FelIvaCalculator {

    public static final BigDecimal FACTOR_IVA = new BigDecimal("1.12");
    public static final int ESCALA_DECIMAL = 5;

    private FelIvaCalculator() {}

    public record DesgloseIva(BigDecimal montoGravable, BigDecimal montoImpuesto, BigDecimal total) {}

    public static DesgloseIva desglosar(BigDecimal totalConIva) {
        BigDecimal gravable = totalConIva.divide(FACTOR_IVA, ESCALA_DECIMAL, RoundingMode.HALF_UP);
        BigDecimal impuesto = totalConIva.subtract(gravable).setScale(ESCALA_DECIMAL, RoundingMode.HALF_UP);
        BigDecimal total = totalConIva.setScale(ESCALA_DECIMAL, RoundingMode.HALF_UP);
        return new DesgloseIva(gravable, impuesto, total);
    }
}
