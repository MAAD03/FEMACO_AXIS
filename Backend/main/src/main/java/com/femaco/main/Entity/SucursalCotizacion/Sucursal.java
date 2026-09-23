package com.femaco.main.Entity.SucursalCotizacion;

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
@Table(name = "sucursal")
public class Sucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdSucursal")
    private Long idSucursal;  
    
    @Column(name = "Nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "Direccion", nullable = false, length = 250)
    private String direccion;

    @Column(name = "Telefono", nullable = true, length = 45)
    private String telefono;

    @Column(name = "FelNitEmisor", length = 20)
    private String felNitEmisor;

    @Column(name = "FelNombreEmisor", length = 200)
    private String felNombreEmisor;

    @Column(name = "FelNombreComercial", length = 200)
    private String felNombreComercial;

    @Column(name = "FelCorreoEmisor", length = 150)
    private String felCorreoEmisor;

    @Column(name = "FelCodigoEstablecimiento", length = 10)
    private String felCodigoEstablecimiento;

    @Column(name = "FelAfiliacionIva", length = 10)
    private String felAfiliacionIva;

    @Column(name = "FelDireccion", length = 255)
    private String felDireccion;

    @Column(name = "FelCodigoPostal", length = 10)
    private String felCodigoPostal;

    @Column(name = "FelMunicipio", length = 100)
    private String felMunicipio;

    @Column(name = "FelDepartamento", length = 100)
    private String felDepartamento;

    @Column(name = "FelPais", length = 5)
    private String felPais;

    @Column(name = "FelTipoFrase", length = 5)
    private String felTipoFrase;

    @Column(name = "FelCodigoEscenario", length = 5)
    private String felCodigoEscenario;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

}
