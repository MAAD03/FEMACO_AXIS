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
@Table(name = "orden_compra")
public class OrdenCompra  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrdenCompra")
    private Long idOrdenCompra;
 
    @Column(name = "Total", precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "Notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdProveedor")
    private Long idProveedor;

    @Column(name = "IdEstadoOrdenCompra")
    private Long idEstadoOrdenCompra;

    @Column(name = "IdUsuario")
    private Long idUsuario;  
    
}
