package com.femaco.main.DTOs.Dashboard;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/** Granularidad temporal de las series del dashboard. */
public enum Agrupacion {

    DIA {
        @Override public LocalDate inicioDePeriodo(LocalDate fecha) { return fecha; }
        @Override public LocalDate siguiente(LocalDate inicio) { return inicio.plusDays(1); }
    },
    SEMANA { // semanas ISO: inician en lunes
        @Override public LocalDate inicioDePeriodo(LocalDate fecha) {
            return fecha.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }
        @Override public LocalDate siguiente(LocalDate inicio) { return inicio.plusWeeks(1); }
    },
    MES {
        @Override public LocalDate inicioDePeriodo(LocalDate fecha) { return fecha.withDayOfMonth(1); }
        @Override public LocalDate siguiente(LocalDate inicio) { return inicio.plusMonths(1); }
    };

    /** Fecha con la que se etiqueta el período al que pertenece {@code fecha}. */
    public abstract LocalDate inicioDePeriodo(LocalDate fecha);

    /** Inicio del período siguiente. */
    public abstract LocalDate siguiente(LocalDate inicio);
}
