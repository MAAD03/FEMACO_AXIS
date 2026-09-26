package com.femaco.main.DTOs;

import java.util.List;

import com.femaco.main.Entity.SucursalCotizacion.Cotizacion;
import com.femaco.main.Entity.SucursalCotizacion.DetalleCotizacion;

import lombok.Data;

@Data
public class CotizacionConDetallesDTO {

    private Cotizacion cotizacion;
    private List<DetalleCotizacion> detalles;
}