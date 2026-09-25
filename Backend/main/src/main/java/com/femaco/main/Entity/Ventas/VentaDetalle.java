package com.femaco.main.Entity.Ventas;

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
@Table(name = "venta_detalle")
public class VentaDetalle  {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdVentaDetalle")
    private Long idVentaDetalle;

    @Column(name = "Cantidad", precision = 12, scale = 2, nullable = false)
    private BigDecimal cantidad;

    @Column(name = "PrecioUnitario", precision = 12, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @Column(name = "SubtotalBruto", precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotalBruto;

    @Column(name = "PorcDescuentoMayorista", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcDescuentoMayorista;

    @Column(name = "MontoDescuentoMayorista", precision = 12, scale = 2, nullable = false)
    private BigDecimal montoDescuentoMayorista;

    @Column(name = "PorcDescuentoManual", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcDescuentoManual;

    @Column(name = "MontoDescuentoManual", precision = 12, scale = 2, nullable = false)
    private BigDecimal montoDescuentoManual;

    @Column(name = "Subtotal", precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdArticulo", nullable = false)
    private Long idArticulo;

    @Column(name = "IdVenta", nullable = false)
    private Long idVenta;

}
