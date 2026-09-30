package com.femaco.main.DTOs;

import java.time.LocalDate;

import lombok.Data;

@Data
public class PedidoFiltroDTO {

    private Long idPedido;
    private Long idVenta;
    private Long idEstadoPedido;
    private String q;
    private String numeroEntrega;
    private String nitCliente;
    private String numeroFactura;
    private LocalDate fechaEntregaDesde;
    private LocalDate fechaEntregaHasta;
    private LocalDate fechaCreacionDesde;
    private LocalDate fechaCreacionHasta;
}