package com.femaco.main.Config.FEL;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "fel")
public class FelProperties {

    private String ambiente;
    private Soap soap = new Soap();
    private Rest rest = new Rest();
    private Auth auth = new Auth();
    private Origen origen = new Origen();
    private Timeout timeout = new Timeout();

    @Getter
    @Setter
    public static class Soap {
        private String url;
        private String wsdlUrl;
        private String namespace;
        private String actionCertificacion;
        private String actionAnulacion;
    }

    @Getter
    @Setter
    public static class Rest {
        private String baseUrl;
    }

    @Getter
    @Setter
    public static class Auth {
        private String usuario;
        private String clave;
        private Long cliente;
        private Long contrato;
        private String firmarEmisor;
        private String validarIdentificador;
    }

    @Getter
    @Setter
    public static class Origen {
        private String id;
        private String ip;
    }

    @Getter
    @Setter
    public static class Timeout {
        private int connectMs;
        private int readMs;
    }
}