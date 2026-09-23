package com.femaco.main.FEL;

public record FelEmisorContexto(
        String nit, String nombreEmisor, String nombreComercial, String correoEmisor,
        String codigoEstablecimiento, String afiliacionIva,
        String direccion, String codigoPostal, String municipio, String departamento, String pais,
        String tipoFrase, String codigoEscenario
) {}
