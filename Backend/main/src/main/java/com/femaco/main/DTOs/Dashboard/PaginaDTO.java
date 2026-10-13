package com.femaco.main.DTOs.Dashboard;

import java.util.List;

import org.springframework.data.domain.Page;

/** Página serializable de forma estable (no se expone Page<T> directamente). */
public record PaginaDTO<T>(List<T> contenido, int pagina, int tamanio,
                           long totalElementos, int totalPaginas) {

    public static <T> PaginaDTO<T> de(Page<T> page) {
        return new PaginaDTO<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
