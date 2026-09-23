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
    private Dev dev = new Dev(); 

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
   /*
        Propiedades para desarrollo/pruebas. 
        sufijoIdentificador: cuando tiene valor, se concatena al IdVenta para
        formar el DECertificador enviado a TEKRA (en FelDteBuilderService).
        sirve para evitar colisiones cuando el esquema de base de datos se
        recrea repetidamente en desarrollo y los IdVenta autoincrementales se
        reinician, ya que TEKRA identifica documentos certificados de forma
        GLOBAL y PERMANENTE por ese valor.
        Vacío o null (default) = comportamiento normal de producción:
        DECertificador = IdVenta tal cual, sin sufijo.
    */
    @Getter
    @Setter
    public static class Dev {
        private String sufijoIdentificador;
    }
}