package com.femaco.main.DTOs;

import java.time.LocalDate;

import lombok.Data;

@Data
public class VentaFiltroDTO {

    private LocalDate fechaCreacionDesde;
    private LocalDate fechaCreacionHasta;
    private String nitCliente;
    private String numeroFactura;
    private Long idEstadoVenta;
    private String correoUsuario;
}