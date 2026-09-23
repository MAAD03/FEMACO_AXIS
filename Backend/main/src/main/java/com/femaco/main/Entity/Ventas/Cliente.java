package com.femaco.main.Entity.Ventas;

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
@Table(name = "cliente")
public class Cliente  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdCliente")
    private Long idCliente;

    @Column(name = "Nit", nullable = false, length = 45)
    private String nit;

    @Column(name = "Nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "Telefono", nullable = true, length = 45)
    private String telefono;

    @Column(name = "Correo", nullable = true, length = 200)
    private String correo;

    @Column(name = "Direccion", nullable = true, length = 255)
    private String direccion;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdEstadoCliente")
    private Long idEstadoCliente;
}
