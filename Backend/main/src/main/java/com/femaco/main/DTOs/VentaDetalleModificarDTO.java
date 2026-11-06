package com.femaco.main.DTOs;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VentaDetalleModificarDTO {

    private Long idVentaDetalle;

    private Long idArticulo;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.00", message = "La cantidad no puede ser negativa")
    private BigDecimal cantidad;

    @DecimalMin(value = "0.00", message = "El porcentaje de descuento manual no puede ser negativo")
    @DecimalMax(value = "100.00", message = "El porcentaje de descuento manual no puede superar 100")
    private BigDecimal porcDescuentoManual;
}