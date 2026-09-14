package com.femaco.main.DTOs;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdenCompraCreateDTO {

    @NotNull(message = "El campo idProveedor es obligatorio")
    private Long idProveedor;

    private String notas;

    @NotEmpty(message = "Debe incluir al menos un detalle en la orden de compra")
    @Valid
    private List<OrdenCompraDetalleCreateDTO> detalles;
}
