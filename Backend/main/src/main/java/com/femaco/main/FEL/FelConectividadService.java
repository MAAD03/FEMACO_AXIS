package com.femaco.main.FEL;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.femaco.main.Config.FEL.FelProperties;

@Service
public class FelConectividadService {

    private final RestClient restClient;
    private final FelProperties felProperties;

    public FelConectividadService(RestClient felRestClient, FelProperties felProperties) {
        this.restClient = felRestClient;
        this.felProperties = felProperties;
    }

    public record ResultadoConectividad(boolean ok, String mensaje) {}

    public ResultadoConectividad probarConexion() {
        String wsdlUrl = felProperties.getSoap().getWsdlUrl();
        try {
            String body = restClient.get()
                    .uri(wsdlUrl)
                    .retrieve()
                    .body(String.class);

            boolean ok = body != null && body.contains("wsdl:definitions");
            return new ResultadoConectividad(ok,
                    ok ? "Conexión exitosa al WSDL de TEKRA (ambiente pruebas)."
                       : "El servidor respondió pero el contenido no parece un WSDL válido.");
        } catch (RestClientException e) {
            return new ResultadoConectividad(false, "No se pudo conectar: " + e.getMessage());
        }
    }
}