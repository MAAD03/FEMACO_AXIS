package com.femaco.main.DTOs;

import com.femaco.main.Entity.Ventas.MetodoPago;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VentaPagoDTO {

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    @Size(max = 45, message = "La referencia de pago no puede exceder 45 caracteres")
    private String referenciaPago;
}
