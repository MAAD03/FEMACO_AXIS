package com.femaco.main.Entity.Inventario;

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
@Table(name = "articulo")
public class Articulo  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdArticulo")
    private Long idArticulo;

    @Column(name = "Codigo", nullable = false, length = 50)
    private String codigo;

    @Column(name = "Nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "Descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "StockActual", precision = 12, scale = 2)
    private BigDecimal stockActual;

    @Column(name = "StockMinimo", precision = 12, scale = 2)
    private BigDecimal stockMinimo;

    @Column(name = "PrecioCompraUltimoProveedor", precision = 12, scale = 2)
    private BigDecimal precioCompraUltimoProveedor;

    @Column(name = "MargenGanancia", precision = 5, scale = 2)
    private BigDecimal margenGanancia;

    @Column(name = "CantidadMinimaDescuento", precision = 12, scale = 2)
    private BigDecimal cantidadMinimaDescuento;
    
    @Column(name = "DescuentoMayorista", precision = 5, scale = 2)
    private BigDecimal descuentoMayorista;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdAreaArticulo")
    private Long idAreaArticulo;  

    @Column(name = "IdUnidadMedida")
    private Long idUnidadMedida;

    @Column(name = "IdEstadoArticulo")
    private Long idEstadoArticulo;

}
