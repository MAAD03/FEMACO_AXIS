package com.femaco.main.FEL;

import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class FelSoapResponseParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public record CertificacionResultado(
            boolean exito, Integer codigoError, String mensajeError,
            String numeroAutorizacion, String serieDocumento, String numeroDocumento,
            String nitCertificador, String nombreCertificador,
            String fechaHoraEmision, String fechaHoraCertificacion,
            String xmlCertificado, String codigoQR) {}

    public record AnulacionResultado(
            boolean exito, Integer codigoError, String mensajeError, String xmlAnulacionCertificado) {}

    public CertificacionResultado parsearCertificacion(String soapXml) {
        Element raiz = parsearDocumento(soapXml);

        JsonNode resultadoNode = leerJson(textoDeHijo(raiz, "ResultadoCertificacion"));
        int error = (resultadoNode != null && resultadoNode.hasNonNull("error"))
                ? resultadoNode.get("error").asInt() : -1;
        boolean exito = error == 0;

        String mensajeError = null;
        if (!exito) {
            JsonNode erroresXsd = resultadoNode != null ? resultadoNode.get("errores_xsd") : null;
            mensajeError = (erroresXsd != null && !erroresXsd.isNull())
                    ? erroresXsd.toString()
                    : "Error de certificación código " + error;
        }

        return new CertificacionResultado(
                exito, error, mensajeError,
                textoDeHijo(raiz, "NumeroAutorizacion"),
                textoDeHijo(raiz, "SerieDocumento"),
                textoDeHijo(raiz, "NumeroDocumento"),
                textoDeHijo(raiz, "NITCertificador"),
                textoDeHijo(raiz, "NombreCertificador"),
                textoDeHijo(raiz, "FechaHoraEmision"),
                textoDeHijo(raiz, "FechaHoraCertificacion"),
                exito ? serializarHijo(raiz, "DocumentoCertificado") : null,
                exito ? textoDeHijo(raiz, "CodigoQR") : null
        );
    }

    public AnulacionResultado parsearAnulacion(String soapXml) {
        Element raiz = parsearDocumento(soapXml);

        JsonNode resultadoNode = leerJson(textoDeHijo(raiz, "ResultadoAnulacion"));
        int error = (resultadoNode != null && resultadoNode.hasNonNull("error"))
                ? resultadoNode.get("error").asInt() : -1;
        boolean exito = error == 0;

        return new AnulacionResultado(
                exito, error,
                exito ? null : "Error de anulación código " + error,
                exito ? serializarHijo(raiz, "AnulacionCertificada") : null
        );
    }

    private Element parsearDocumento(String soapXml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(soapXml.getBytes(StandardCharsets.UTF_8)));
            return doc.getDocumentElement();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo parsear la respuesta SOAP de TEKRA: " + e.getMessage(), e);
        }
    }

    private String textoDeHijo(Element raiz, String nombreLocal) {
        NodeList lista = raiz.getElementsByTagNameNS("*", nombreLocal);
        if (lista.getLength() == 0) return null;
        String texto = lista.item(0).getTextContent();
        return texto != null ? texto.trim() : null;
    }

    private String serializarHijo(Element raiz, String nombreLocal) {
        NodeList lista = raiz.getElementsByTagNameNS("*", nombreLocal);
        if (lista.getLength() == 0) return null;
        Node nodo = lista.item(0);

        boolean tieneHijosElemento = false;
        NodeList hijos = nodo.getChildNodes();
        for (int i = 0; i < hijos.getLength(); i++) {
            if (hijos.item(i).getNodeType() == Node.ELEMENT_NODE) {
                tieneHijosElemento = true;
                break;
            }
        }

        if (!tieneHijosElemento) {
            return nodo.getTextContent();
            }

        try {
            Transformer transformer = TransformerFactory.newInstance().newTransformer();
            transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
            StringWriter writer = new StringWriter();
            for (int i = 0; i < hijos.getLength(); i++) {
                transformer.transform(new DOMSource(hijos.item(i)), new StreamResult(writer));
            }
            return writer.toString();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo serializar el documento certificado: " + e.getMessage(), e);
            }
        }

        private JsonNode leerJson(String json) {
            if (json == null || json.isBlank()) return null;
            try {
                return objectMapper.readTree(json);
            } catch (Exception e) {
                return null;
            }
    }
}
