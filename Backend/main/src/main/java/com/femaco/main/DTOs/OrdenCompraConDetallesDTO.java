package com.femaco.main.DTOs;

import java.util.List;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.Suministro.OrdenCompra;
import com.femaco.main.Entity.Suministro.OrdenCompraDetalle;
import com.femaco.main.Entity.Suministro.Proveedor;

import lombok.Data;

@Data
public class OrdenCompraConDetallesDTO {

    private OrdenCompra ordenCompra;
    private Proveedor proveedor;
    private Usuario usuarioCreacion;
    private List<OrdenCompraDetalle> detalles;
}
