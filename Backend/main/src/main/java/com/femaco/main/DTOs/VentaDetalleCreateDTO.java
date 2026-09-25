package com.femaco.main.DTOs;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VentaDetalleCreateDTO {

    @NotNull(message = "El campo idArticulo es obligatorio")
    private Long idArticulo;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    private BigDecimal cantidad;

    @DecimalMin(value = "0.00", message = "El porcentaje de descuento manual no puede ser negativo")
    @DecimalMax(value = "100.00", message = "El porcentaje de descuento manual no puede superar 100")
    private BigDecimal porcDescuentoManual;
}
