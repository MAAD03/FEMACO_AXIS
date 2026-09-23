package com.femaco.main.FEL;

import java.math.BigDecimal;

public record FelItemContexto(
        String descripcion,
        BigDecimal cantidad,
        BigDecimal precioUnitario,
        BigDecimal descuentoMonto,
        BigDecimal totalLinea // ya con IVA incluido, es lo realmente cobrado en venta_detalle.Subtotal
) {}
