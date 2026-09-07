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
@Table(name = "ajuste_inventario")

public class AjusteInventario  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdAjusteInventario")
    private Long idAjusteInventario;

    @Column(name = "CantidadAjuste", precision = 12, scale = 2)
    private BigDecimal cantidadAjuste;

    @Column(name = "Motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdArticulo")
    private Long idArticulo;

    @Column(name = "IdUsuario")
    private Long idUsuario;  
    
}
