package com.femaco.main.Entity.Ventas;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "venta_fel")
public class VentaFel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdVentaFel")
    private Long idVentaFel;

    @Column(name = "IdVenta", nullable = false, unique = true)
    private Long idVenta;

    @Column(name = "TipoDte", nullable = false, length = 10)
    private String tipoDte;

    @Column(name = "NumeroAutorizacion", length = 50)
    private String numeroAutorizacion;

    @Column(name = "SerieDocumento", length = 20)
    private String serieDocumento;

    @Column(name = "NumeroDocumento", length = 20)
    private String numeroDocumento;

    @Column(name = "FechaHoraEmision")
    private LocalDateTime fechaHoraEmision;

    @Column(name = "FechaHoraCertificacion")
    private LocalDateTime fechaHoraCertificacion;

    @Column(name = "NitCertificador", length = 20)
    private String nitCertificador;

    @Column(name = "NombreCertificador", length = 150)
    private String nombreCertificador;

    @Column(name = "MontoGravable", precision = 12, scale = 2)
    private BigDecimal montoGravable;

    @Column(name = "MontoImpuestoIva", precision = 12, scale = 2)
    private BigDecimal montoImpuestoIva;

    @Column(name = "GranTotal", precision = 12, scale = 2)
    private BigDecimal granTotal;

    @Column(name = "EstadoDocumento", length = 20)
    private String estadoDocumento;

    @Lob
    @Column(name = "XmlCertificado", columnDefinition = "LONGTEXT")
    private String xmlCertificado;

    @Lob
    @Column(name = "CodigoQR", columnDefinition = "LONGTEXT")
    private String codigoQR;

    @Column(name = "CodigoErrorCertificacion")
    private Integer codigoErrorCertificacion;

    @Lob
    @Column(name = "MensajeErrorCertificacion")
    private String mensajeErrorCertificacion;

    @Column(name = "FechaHoraAnulacion")
    private LocalDateTime fechaHoraAnulacion;

    @Column(name = "MotivoAnulacion", length = 255)
    private String motivoAnulacion;

    @Lob
    @Column(name = "XmlAnulacionCertificado", columnDefinition = "LONGTEXT")
    private String xmlAnulacionCertificado;

    @Column(name = "FechaCreacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "UsuarioCreacion", nullable = false, updatable = false)
    private Integer usuarioCreacion;

    @Column(name = "FechaModif", nullable = false)
    private LocalDateTime fechaModif;

    @Column(name = "UsuarioModif", nullable = false)
    private Integer usuarioModif;

}
