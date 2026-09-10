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
@Table(name = "movimiento_inventario")
public class MovimientoInventario  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdMovimientoInventario")
    private Long idMovimientoInventario;
    
    @Column(name = "TipoMovimiento", nullable = false, length = 50)
    private String tipoMovimiento;

    @Column(name = "Cantidad", precision = 12, scale = 2, nullable = false)
    private BigDecimal cantidad;

    @Column(name = "StockViejo", precision = 12, scale = 2, nullable = false)
    private BigDecimal stockViejo;

    @Column(name = "StockNuevo", precision = 12, scale = 2, nullable = false)
    private BigDecimal stockNuevo;

    @Column(name = "Motivo", nullable = false, length = 50)
    private String motivo;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdArticulo", nullable = true)
    private Long idArticulo;

    @Column(name = "IdVenta", nullable = true)
    private Long idVenta;

    @Column(name = "IdOrdenCompra", nullable = true)
    private Long idOrdenCompra;

    @Column(name = "IdAjusteInventario", nullable = true)
    private Long idAjusteInventario;

    @Column(name = "IdUsuario", nullable = true)
    private Long idUsuario;

}
