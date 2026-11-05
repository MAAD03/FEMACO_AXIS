package com.femaco.main.Entity.Suministro;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "orden_compra_detalle")
public class OrdenCompraDetalle  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrdenCompraDetalle")
    private Long idOrdenCompraDetalle;

    @Column(name = "Cantidad", precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "PrecioUnitario", precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "Total", precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "ActualizarPrecio", nullable = false)
    private Boolean actualizarPrecio;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdOrdenCompra")
    private Long idOrdenCompra;

    @Column(name = "IdArticulo")
    private Long idArticulo;

    @Column(name = "IdEstadoOrdenCompra")
    private Long idEstadoOrdenCompra;

}
