package com.femaco.main.FEL;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.femaco.main.Config.FEL.FelProperties;

@Component
public class FelSoapClient {

    private final RestClient restClient;
    private final FelProperties props;

    public FelSoapClient(RestClient felRestClient, FelProperties props) {
        this.restClient = felRestClient;
        this.props = props;
    }

    public String certificarDocumento(String dteXml) {
        return enviar(construirSobreCertificacion(dteXml), props.getSoap().getActionCertificacion());
    }

    public String anularDocumento(String anulacionXml) {
        return enviar(construirSobreAnulacion(anulacionXml), props.getSoap().getActionAnulacion());
    }

    private String enviar(String sobreXml, String soapAction) {
        String respuesta = restClient.post()
            .uri(props.getSoap().getUrl())
            .header("SOAPAction", soapAction)
            .contentType(MediaType.valueOf("text/xml;charset=UTF-8"))
            .body(sobreXml)
            .exchange((request, response) -> {
                try (java.io.InputStream is = response.getBody()) {
                    byte[] bytes = is.readAllBytes();
                    return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                }
            });
        /* --SOUTs de depuracion
        System.out.println("=== FEL REQUEST ===");
        System.out.println(sobreXml);
        System.out.println("=== FEL RESPONSE ===");
        System.out.println(respuesta);
        */
        return respuesta;
}
 
    private String construirSobreCertificacion(String dteXml) {
        return "<Envelope xmlns=\"http://schemas.xmlsoap.org/soap/envelope/\">"
                + "<Body>"
                + "<CertificacionDocumento xmlns=\"" + props.getSoap().getNamespace() + "\">"
                + "<Autenticacion>" + construirAutenticacionCertificacion() + "</Autenticacion>"
                + "<Documento><![CDATA[" + dteXml + "]]></Documento>"
                + "</CertificacionDocumento>"
                + "</Body>"
                + "</Envelope>";
    }

    private String construirSobreAnulacion(String anulacionXml) {
        return "<Envelope xmlns=\"http://schemas.xmlsoap.org/soap/envelope/\">"
                + "<Body>"
                + "<AnulacionDocumento xmlns=\"" + props.getSoap().getNamespace() + "\">"
                + "<Autenticacion>" + construirAutenticacionAnulacion() + "</Autenticacion>"
                + "<Documento><![CDATA[" + anulacionXml + "]]></Documento>"
                + "</AnulacionDocumento>"
                + "</Body>"
                + "</Envelope>";
    }

    private String construirAutenticacionCertificacion() {
        FelProperties.Auth auth = props.getAuth();
        FelProperties.Origen origen = props.getOrigen();
        return "<pn_usuario>" + FelXmlTextUtil.escapar(auth.getUsuario()) + "</pn_usuario>"
                + "<pn_clave>" + FelXmlTextUtil.escapar(auth.getClave()) + "</pn_clave>"
                + "<pn_cliente>" + auth.getCliente() + "</pn_cliente>"
                + "<pn_contrato>" + auth.getContrato() + "</pn_contrato>"
                + "<pn_id_origen>" + FelXmlTextUtil.escapar(origen.getId()) + "</pn_id_origen>"
                + "<pn_ip_origen>" + FelXmlTextUtil.escapar(origen.getIp()) + "</pn_ip_origen>"
                + "<pn_firmar_emisor>" + auth.getFirmarEmisor() + "</pn_firmar_emisor>"
                + "<pn_validar_identificador>" + auth.getValidarIdentificador() + "</pn_validar_identificador>";
    }

    private String construirAutenticacionAnulacion() {
    FelProperties.Auth auth = props.getAuth();
    return "<pn_usuario>" + FelXmlTextUtil.escapar(auth.getUsuario()) + "</pn_usuario>"
            + "<pn_clave>" + FelXmlTextUtil.escapar(auth.getClave()) + "</pn_clave>"
            + "<pn_cliente>" + auth.getCliente() + "</pn_cliente>"
            + "<pn_contrato>" + auth.getContrato() + "</pn_contrato>"
            + "<pn_firmar_emisor>" + auth.getFirmarEmisor() + "</pn_firmar_emisor>";
}
}
