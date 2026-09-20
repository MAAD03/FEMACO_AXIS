package com.femaco.main.DTOs;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdenCompraUpdateDTO {

    @NotNull(message = "El campo idOrdenCompra es obligatorio")
    private Long idOrdenCompra;

    private String notas;

    private Long idEstadoOrdenCompra;

    @NotEmpty(message = "Debe incluir al menos un detalle en la orden de compra")
    @Valid
    private List<OrdenCompraDetalleUpdateDTO> detalles;
}
