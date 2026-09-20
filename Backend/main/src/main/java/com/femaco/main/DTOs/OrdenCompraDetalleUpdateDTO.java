package com.femaco.main.DTOs;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdenCompraDetalleUpdateDTO {

    @NotNull(message = "El campo idOrdenCompraDetalle es obligatorio")
    private Long idOrdenCompraDetalle;

    private Long idArticulo;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    private BigDecimal cantidad;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio unitario debe ser mayor a 0")
    private BigDecimal precioUnitario;

    private Long idEstadoOrdenCompra;
}
