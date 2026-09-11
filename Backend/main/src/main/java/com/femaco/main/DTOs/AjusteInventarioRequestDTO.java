package com.femaco.main.DTOs;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class AjusteInventarioRequestDTO {

    private BigDecimal cantidad;
    private Boolean agregar;
    private Boolean quitar;
    private String motivo;
    private Long idArticulo;
    private Long idUsuario;
    private Integer usuarioCreacion;
}
