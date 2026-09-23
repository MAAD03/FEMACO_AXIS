package com.femaco.main.FEL;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class FelDteFacturaBuilder {

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSxxx");

    public record ResultadoFactura(String xml, BigDecimal granTotalCalculado, BigDecimal totalImpuestoCalculado) {}

    public ResultadoFactura construirXml(FelEmisorContexto emisor,
                                          FelReceptorContexto receptor,
                                          List<FelItemContexto> items,
                                          String identificadorUnico) {

        OffsetDateTime fechaEmision = OffsetDateTime.now(ZoneOffset.of("-06:00"));
        String fechaEmisionStr = fechaEmision.format(FORMATO_FECHA);

        StringBuilder itemsXml = new StringBuilder();
        BigDecimal totalImpuesto = BigDecimal.ZERO;
        BigDecimal granTotal = BigDecimal.ZERO;

        int numeroLinea = 1;
        for (FelItemContexto item : items) {
            FelIvaCalculator.DesgloseIva desglose = FelIvaCalculator.desglosar(item.totalLinea());
            BigDecimal precioBruto = item.totalLinea().add(item.descuentoMonto()).setScale(5, RoundingMode.HALF_UP);
            BigDecimal descuento = item.descuentoMonto().setScale(5, RoundingMode.HALF_UP);

            totalImpuesto = totalImpuesto.add(desglose.montoImpuesto());
            granTotal = granTotal.add(desglose.total());

            itemsXml.append("<dte:Item NumeroLinea=\"").append(numeroLinea).append("\" BienOServicio=\"B\">")
                    .append("<dte:Cantidad>").append(item.cantidad().toPlainString()).append("</dte:Cantidad>")
                    .append("<dte:Descripcion>").append(FelXmlTextUtil.escapar(item.descripcion())).append("</dte:Descripcion>")
                    .append("<dte:PrecioUnitario>").append(item.precioUnitario().toPlainString()).append("</dte:PrecioUnitario>")
                    .append("<dte:Precio>").append(precioBruto.toPlainString()).append("</dte:Precio>")
                    .append("<dte:Descuento>").append(descuento.toPlainString()).append("</dte:Descuento>")
                    .append("<dte:Impuestos><dte:Impuesto>")
                    .append("<dte:NombreCorto>IVA</dte:NombreCorto>")
                    .append("<dte:CodigoUnidadGravable>1</dte:CodigoUnidadGravable>")
                    .append("<dte:MontoGravable>").append(desglose.montoGravable().toPlainString()).append("</dte:MontoGravable>")
                    .append("<dte:MontoImpuesto>").append(desglose.montoImpuesto().toPlainString()).append("</dte:MontoImpuesto>")
                    .append("</dte:Impuesto></dte:Impuestos>")
                    .append("<dte:Total>").append(desglose.total().toPlainString()).append("</dte:Total>")
                    .append("</dte:Item>");

            numeroLinea++;
        }

        String frasesXml = construirFrases(emisor);

        String direccionReceptor = (receptor.direccion() != null && !receptor.direccion().isBlank())
                ? FelXmlTextUtil.escapar(receptor.direccion())
                : "Guatemala";

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<dte:GTDocumento Version=\"0.1\" "
                + "xmlns:dte=\"http://www.sat.gob.gt/dte/fel/0.2.0\" "
                + "xmlns:cfc=\"http://www.sat.gob.gt/dte/fel/CompCambiaria/0.1.0\" "
                + "xmlns:cex=\"http://www.sat.gob.gt/face2/ComplementoExportaciones/0.1.0\" "
                + "xmlns:cfe=\"http://www.sat.gob.gt/face2/ComplementoFacturaEspecial/0.1.0\" "
                + "xmlns:cno=\"http://www.sat.gob.gt/face2/ComplementoReferenciaNota/0.1.0\" "
                + "xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\" "
                + "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"
                + "<dte:SAT ClaseDocumento=\"dte\">"
                + "<dte:DTE ID=\"DatosCertificados\">"
                + "<dte:DatosEmision ID=\"DatosEmision\">"
                + "<dte:DatosGenerales Tipo=\"FACT\" FechaHoraEmision=\"" + fechaEmisionStr + "\" CodigoMoneda=\"GTQ\" />"
                + "<dte:Emisor NITEmisor=\"" + emisor.nit() + "\" "
                + "NombreEmisor=\"" + FelXmlTextUtil.escapar(emisor.nombreEmisor()) + "\" "
                + "CodigoEstablecimiento=\"" + emisor.codigoEstablecimiento() + "\" "
                + "NombreComercial=\"" + FelXmlTextUtil.escapar(emisor.nombreComercial()) + "\" "
                + "CorreoEmisor=\"" + FelXmlTextUtil.escapar(emisor.correoEmisor()) + "\" "
                + "AfiliacionIVA=\"" + emisor.afiliacionIva() + "\">"
                + "<dte:DireccionEmisor>"
                + "<dte:Direccion>" + FelXmlTextUtil.escapar(emisor.direccion()) + "</dte:Direccion>"
                + "<dte:CodigoPostal>" + emisor.codigoPostal() + "</dte:CodigoPostal>"
                + "<dte:Municipio>" + FelXmlTextUtil.escapar(emisor.municipio()) + "</dte:Municipio>"
                + "<dte:Departamento>" + FelXmlTextUtil.escapar(emisor.departamento()) + "</dte:Departamento>"
                + "<dte:Pais>" + emisor.pais() + "</dte:Pais>"
                + "</dte:DireccionEmisor>"
                + "</dte:Emisor>"
                + "<dte:Receptor IDReceptor=\"" + receptor.nit() + "\" "
                + "NombreReceptor=\"" + FelXmlTextUtil.escapar(receptor.nombre()) + "\" "
                + "CorreoReceptor=\"" + FelXmlTextUtil.escapar(receptor.correo()) + "\">"
                + "<dte:DireccionReceptor>"
                + "<dte:Direccion>" + direccionReceptor + "</dte:Direccion>"
                + "<dte:CodigoPostal>0</dte:CodigoPostal>"
                + "<dte:Municipio></dte:Municipio>"
                + "<dte:Departamento></dte:Departamento>"
                + "<dte:Pais>GT</dte:Pais>"
                + "</dte:DireccionReceptor>"
                + "</dte:Receptor>"
                + frasesXml
                + "<dte:Items>" + itemsXml + "</dte:Items>"
                + "<dte:Totales>"
                + "<dte:TotalImpuestos>"
                + "<dte:TotalImpuesto NombreCorto=\"IVA\" TotalMontoImpuesto=\"" + totalImpuesto.toPlainString() + "\" />"
                + "</dte:TotalImpuestos>"
                + "<dte:GranTotal>" + granTotal.toPlainString() + "</dte:GranTotal>"
                + "</dte:Totales>"
                + "</dte:DatosEmision>"
                + "</dte:DTE>"
                + "<dte:Adenda>"
                + "<DECertificador>" + identificadorUnico + "</DECertificador>"
                + "</dte:Adenda>"
                + "</dte:SAT>"
                + "</dte:GTDocumento>";

        return new ResultadoFactura(xml, granTotal, totalImpuesto);
    }

    private String construirFrases(FelEmisorContexto emisor) {
        if (emisor.tipoFrase() == null || emisor.tipoFrase().isBlank()
                || emisor.codigoEscenario() == null || emisor.codigoEscenario().isBlank()) {
        throw new IllegalStateException(
                "La sucursal no tiene configurada FelTipoFrase/FelCodigoEscenario. " +
                "Estos datos son obligatorios para certificar documentos tipo FACT.");
    }
        return "<dte:Frases><dte:Frase TipoFrase=\"" + emisor.tipoFrase() + "\" "
                + "CodigoEscenario=\"" + emisor.codigoEscenario() + "\" /></dte:Frases>";
        }
}
