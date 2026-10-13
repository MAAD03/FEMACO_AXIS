package com.femaco.main.Config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DashboardProperties.class)
public class DashboardConfig {

    /**
     * Usa la zona horaria del servidor para mantener "hoy" alineado con las fechas guardadas por VentaService.
     */
    @Bean
    public Clock dashboardClock() {
        return Clock.systemDefaultZone();
    }
}
