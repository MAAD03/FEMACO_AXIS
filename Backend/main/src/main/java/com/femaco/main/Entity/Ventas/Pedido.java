package com.femaco.main.Entity.Ventas;

import java.time.LocalDate;
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
@Table(name = "pedido")
public class Pedido  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdPedido")
    private Long idPedido;    

    @Column(name = "FechaEntrega")
    private LocalDate fechaEntrega;

    @Column(name = "DireccionEntrega", columnDefinition = "TEXT")
    private String direccionEntrega;

    @Column(name = "NotasEntrega", columnDefinition = "TEXT")
    private String notasEntrega;

    @Column(name = "NumeroEntrega", nullable = false, length = 50)
    private String numeroEntrega;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdVenta")
    private Long idVenta;

    @Column(name = "IdEstadoPedido")
    private Long idEstadoPedido;
    
    
}
