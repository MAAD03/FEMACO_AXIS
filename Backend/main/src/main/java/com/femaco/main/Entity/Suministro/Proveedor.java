package com.femaco.main.Entity.Suministro;

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
@Table(name = "proveedor")
public class Proveedor  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdProveedor")
    private Long idProveedor;

    @Column(name = "Nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "Nit", nullable = true, length = 45)
    private String nit;

    @Column(name = "Telefono", nullable = true, length = 45)
    private String telefono;
    
    @Column(name = "Direccion", nullable = true, columnDefinition = "TEXT")
    private String direccion;

    @Column(name = "NombreContacto", nullable = true, length = 100)
    private String nombreContacto;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

    @Column(name = "IdEstadoProveedor")
    private Long idEstadoProveedor;
    
}
