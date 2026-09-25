package com.femaco.main.DTOs;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class VentaCreateDTO {

    private Long idCliente;

    private boolean consumidorFinal;

    @NotEmpty(message = "Debe incluir al menos un detalle en la venta")
    @Valid
    private List<VentaDetalleCreateDTO> detalles;
}
