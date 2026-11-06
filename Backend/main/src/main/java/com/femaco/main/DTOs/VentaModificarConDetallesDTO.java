package com.femaco.main.DTOs;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VentaModificarConDetallesDTO {

    @NotNull(message = "Debe incluir el detalle que desea agregar o modificar")
    @Valid
    private VentaDetalleModificarDTO detalle;
}