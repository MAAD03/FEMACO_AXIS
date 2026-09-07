package com.femaco.main.DTOs;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ArticuloFiltroDTO {

    private String q;                    
    private Long idArea;
    private Long idEstado;
    private Long idUnidad;
    private Boolean stockBajo;          
    private Boolean sinStock;            
    private BigDecimal stockMin;
    private BigDecimal stockMax;
    private BigDecimal precioMin;
    private BigDecimal precioMax;
    
}
