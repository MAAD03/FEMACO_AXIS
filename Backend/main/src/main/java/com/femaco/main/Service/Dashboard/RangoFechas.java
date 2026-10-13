package com.femaco.main.Service.Dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import com.femaco.main.Exception.BusinessException;


public record RangoFechas(LocalDate desde, LocalDate hasta) {

    public RangoFechas {
        if (desde == null || hasta == null) {
            throw new BusinessException("Las fechas 'desde' y 'hasta' son obligatorias");
        }
        if (desde.isAfter(hasta)) {
            throw new BusinessException("La fecha 'desde' no puede ser posterior a 'hasta'");
        }
    }

    public static RangoFechas resolver(LocalDate desde, LocalDate hasta, LocalDate hoy,
                                       int diasPorDefecto, int maxDias) {
        LocalDate fin = hasta != null ? hasta : hoy;
        LocalDate inicio = desde != null ? desde : fin.minusDays(diasPorDefecto - 1L);
        RangoFechas rango = new RangoFechas(inicio, fin);
        if (ChronoUnit.DAYS.between(inicio, fin) + 1 > maxDias) {
            throw new BusinessException("El rango de fechas no puede superar " + maxDias + " días");
        }
        return rango;
    }

    public LocalDateTime inicio() {
        return desde.atStartOfDay();
    }

    public LocalDateTime finExclusivo() {
        return hasta.plusDays(1).atStartOfDay();
    }
}
