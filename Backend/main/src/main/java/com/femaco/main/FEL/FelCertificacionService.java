package com.femaco.main.FEL;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Repository.Ventas.VentaFelRepository;

@Service
public class FelCertificacionService {

    private final FelDteBuilderService dteBuilderService;
    private final FelSoapClient soapClient;
    private final FelSoapResponseParser responseParser;
    private final VentaFelRepository ventaFelRepository;

    public FelCertificacionService(FelDteBuilderService dteBuilderService,
                                    FelSoapClient soapClient,
                                    FelSoapResponseParser responseParser,
                                    VentaFelRepository ventaFelRepository) {
        this.dteBuilderService = dteBuilderService;
        this.soapClient = soapClient;
        this.responseParser = responseParser;
        this.ventaFelRepository = ventaFelRepository;
    }

    @Transactional
    public VentaFel certificar(Long idVenta, Integer idUsuarioAccion) {
        VentaFel existente = ventaFelRepository.findByIdVenta(idVenta).orElse(null);
        if (existente != null && "VIGENTE".equalsIgnoreCase(existente.getEstadoDocumento())) {
            return existente;
        }

        FelDteBuilderService.DteFacturaGenerado generado = dteBuilderService.armarDteFactura(idVenta);
        String respuestaSoap = soapClient.certificarDocumento(generado.xml());
        FelSoapResponseParser.CertificacionResultado resultado = responseParser.parsearCertificacion(respuestaSoap);

        VentaFel ventaFel = existente != null ? existente : new VentaFel();
        LocalDateTime ahora = LocalDateTime.now();
        boolean esNuevo = ventaFel.getFechaCreacion() == null;

        ventaFel.setIdVenta(idVenta);
        ventaFel.setTipoDte("FACT");

        if (resultado.exito()) {
            ventaFel.setNumeroAutorizacion(resultado.numeroAutorizacion());
            ventaFel.setSerieDocumento(resultado.serieDocumento());
            ventaFel.setNumeroDocumento(resultado.numeroDocumento());
            ventaFel.setNitCertificador(resultado.nitCertificador());
            ventaFel.setNombreCertificador(resultado.nombreCertificador());
            ventaFel.setMontoGravable(generado.montoGravable());
            ventaFel.setMontoImpuestoIva(generado.montoImpuestoIva());
            ventaFel.setGranTotal(generado.granTotal());
            ventaFel.setEstadoDocumento("VIGENTE");
            ventaFel.setXmlCertificado(resultado.xmlCertificado());
            ventaFel.setCodigoQR(resultado.codigoQR());
            ventaFel.setCodigoErrorCertificacion(0);
            ventaFel.setMensajeErrorCertificacion(null);
            ventaFel.setFechaHoraEmision(parsearFechaSegura(resultado.fechaHoraEmision(), ahora));
            ventaFel.setFechaHoraCertificacion(parsearFechaSegura(resultado.fechaHoraCertificacion(), ahora));
        } else {
            ventaFel.setEstadoDocumento("ERROR");
            ventaFel.setCodigoErrorCertificacion(resultado.codigoError());
            ventaFel.setMensajeErrorCertificacion(resultado.mensajeError());
        }

        if (esNuevo) {
            ventaFel.setFechaCreacion(ahora);
            ventaFel.setUsuarioCreacion(idUsuarioAccion);
        }
        ventaFel.setFechaModif(ahora);
        ventaFel.setUsuarioModif(idUsuarioAccion);

        VentaFel guardado = ventaFelRepository.save(ventaFel);

        if (!resultado.exito()) {
            throw new IllegalStateException("TEKRA rechazó la certificación: " + resultado.mensajeError());
        }
        return guardado;
    }

    private LocalDateTime parsearFechaSegura(String valor, LocalDateTime fallback) {
        if (valor == null || valor.isBlank()) return fallback;
        try {
            return OffsetDateTime.parse(valor).toLocalDateTime();
        } catch (Exception e) {
            return fallback;
        }
    }
}
