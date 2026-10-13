package com.femaco.main.Config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Parámetros del dashboard (application.properties, prefijo "dashboard"). */
@ConfigurationProperties(prefix = "dashboard")
public record DashboardProperties(
        @DefaultValue("1") Long estadoVentaActivaId,
        @DefaultValue("1") Long estadoArticuloActivoId,
        @DefaultValue("30") int diasPorDefecto,
        @DefaultValue("731") int maxDiasRango,
        @DefaultValue("10") int limitePorDefecto,
        @DefaultValue("100") int limiteMaximo) {
}
