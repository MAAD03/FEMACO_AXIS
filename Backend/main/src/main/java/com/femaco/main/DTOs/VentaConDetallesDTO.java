package com.femaco.main.DTOs;

import java.util.List;

import com.femaco.main.Entity.Ventas.Venta;
import com.femaco.main.Entity.Ventas.VentaDetalle;

import lombok.Data;

@Data
public class VentaConDetallesDTO {

    private Venta venta;
    private List<VentaDetalle> detalles;
    private String estadoDocumento;
}
