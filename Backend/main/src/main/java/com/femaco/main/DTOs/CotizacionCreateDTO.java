package com.femaco.main.DTOs;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class CotizacionCreateDTO {

    private String nombre;

    private String nit;

    @NotEmpty(message = "Debe incluir al menos un detalle en la cotizacion")
    @Valid
    private List<CotizacionDetalleCreateDTO> detalles;
}
