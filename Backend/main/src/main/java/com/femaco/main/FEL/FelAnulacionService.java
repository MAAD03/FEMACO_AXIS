package com.femaco.main.FEL;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Repository.Ventas.VentaFelRepository;

@Service
public class FelAnulacionService {

    private final FelDteBuilderService dteBuilderService;
    private final FelSoapClient soapClient;
    private final FelSoapResponseParser responseParser;
    private final VentaFelRepository ventaFelRepository;

    public FelAnulacionService(FelDteBuilderService dteBuilderService,
                                FelSoapClient soapClient,
                                FelSoapResponseParser responseParser,
                                VentaFelRepository ventaFelRepository) {
        this.dteBuilderService = dteBuilderService;
        this.soapClient = soapClient;
        this.responseParser = responseParser;
        this.ventaFelRepository = ventaFelRepository;
    }

    @Transactional
    public VentaFel anular(Long idVenta, String motivo, Integer idUsuarioAccion) {
        VentaFel ventaFel = ventaFelRepository.findByIdVenta(idVenta)
                .orElseThrow(() -> new IllegalStateException("La venta " + idVenta + " no tiene una certificación FEL previa."));

        if ("ANULADO".equalsIgnoreCase(ventaFel.getEstadoDocumento())) {
            return ventaFel;
        }

        String xmlAnulacion = dteBuilderService.armarDteAnulacion(idVenta, motivo);
        String respuestaSoap = soapClient.anularDocumento(xmlAnulacion);
        FelSoapResponseParser.AnulacionResultado resultado = responseParser.parsearAnulacion(respuestaSoap);

        if (!resultado.exito()) {
            throw new IllegalStateException("TEKRA rechazó la anulación: " + resultado.mensajeError());
        }

        LocalDateTime ahora = LocalDateTime.now();
        ventaFel.setEstadoDocumento("ANULADO");
        ventaFel.setFechaHoraAnulacion(ahora);
        ventaFel.setMotivoAnulacion(motivo);
        ventaFel.setXmlAnulacionCertificado(resultado.xmlAnulacionCertificado());
        ventaFel.setFechaModif(ahora);
        ventaFel.setUsuarioModif(idUsuarioAccion);

        return ventaFelRepository.save(ventaFel);
    }
}
