package com.femaco.main.FEL;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

@Component
public class FelDteAnulacionBuilder {

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSxxx");

    public String construirXml(String numeroDocumentoAAnular,
                                String nitEmisor,
                                String idReceptor,
                                OffsetDateTime fechaEmisionOriginal,
                                String motivoAnulacion) {

        OffsetDateTime fechaAnulacion = OffsetDateTime.now(ZoneOffset.of("-06:00"));

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<dte:GTAnulacionDocumento Version=\"0.1\" "
                + "xmlns:dte=\"http://www.sat.gob.gt/dte/fel/0.1.0\" "
                + "xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\" "
                + "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"
                + "<dte:SAT>"
                + "<dte:AnulacionDTE ID=\"DatosCertificados\">"
                + "<dte:DatosGenerales ID=\"DatosAnulacion\" "
                + "NumeroDocumentoAAnular=\"" + numeroDocumentoAAnular + "\" "
                + "NITEmisor=\"" + nitEmisor + "\" "
                + "IDReceptor=\"" + idReceptor + "\" "
                + "FechaEmisionDocumentoAnular=\"" + fechaEmisionOriginal.format(FORMATO_FECHA) + "\" "
                + "FechaHoraAnulacion=\"" + fechaAnulacion.format(FORMATO_FECHA) + "\" "
                + "MotivoAnulacion=\"" + FelXmlTextUtil.escapar(motivoAnulacion) + "\" />"
                + "</dte:AnulacionDTE>"
                + "</dte:SAT>"
                + "</dte:GTAnulacionDocumento>";
    }
}
