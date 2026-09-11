package com.femaco.main.DTOs;

import java.time.LocalDate;

import lombok.Data;

@Data
public class AjusteInventarioFiltroDTO {

    private String q;
    private Long idArticulo;
    private String correoUsuario;
    private LocalDate fechaCreacionDesde;
    private LocalDate fechaCreacionHasta;
    private String tipoMovimiento;

}
