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
@Table(name = "venta")
public class Venta  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdVenta")
    private Long idVenta;

    @Column(name = "Fecha")
    private LocalDateTime fecha;

    @Column(name = "Subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "DescuentoMayoristaTotal", precision = 12, scale = 2, nullable = false)
    private BigDecimal descuentoMayoristaTotal;

    @Column(name = "DescuentoManualTotal", precision = 12, scale = 2, nullable = false)
    private BigDecimal descuentoManualTotal;

    @Column(name = "DescuentoTotal", precision = 12, scale = 2)
    private BigDecimal descuentoTotal;

    @Column(name = "Total", precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "NumeroFactura", length = 45, unique = true)
    private String numeroFactura;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdEstadoVenta", nullable = false)
    private Long idEstadoVenta;

    @Column(name = "IdCliente", nullable = false)
    private Long idCliente;

    @Column(name = "IdUsuario", nullable = false)
    private Long idUsuario;  


}
