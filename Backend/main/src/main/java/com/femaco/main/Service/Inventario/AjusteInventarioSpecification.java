package com.femaco.main.Service.Inventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.femaco.main.DTOs.AjusteInventarioFiltroDTO;
import com.femaco.main.Entity.Inventario.AjusteInventario;
import com.femaco.main.Entity.Seguridad.Usuario;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public class AjusteInventarioSpecification {

    public static Specification<AjusteInventario> conFiltros(AjusteInventarioFiltroDTO filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(filtro.getQ())) {
                String like = "%" + filtro.getQ().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("motivo")), like));
            }

            if (filtro.getIdArticulo() != null) {
                predicates.add(cb.equal(root.get("idArticulo"), filtro.getIdArticulo()));
            }

            if (StringUtils.hasText(filtro.getCorreoUsuario())) {
                String correo = filtro.getCorreoUsuario().trim().toLowerCase();
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Usuario> usuarioRoot = subquery.from(Usuario.class);

                subquery.select(usuarioRoot.get("idUsuario"))
                        .where(cb.equal(cb.lower(usuarioRoot.get("correoElectronico")), correo));

                predicates.add(root.get("idUsuario").in(subquery));
            }

            if (filtro.getFechaCreacionDesde() != null) {
                LocalDateTime desde = filtro.getFechaCreacionDesde().atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaCreacion"), desde));
            }

            if (filtro.getFechaCreacionHasta() != null) {
                LocalDateTime hasta = filtro.getFechaCreacionHasta().atTime(LocalTime.MAX);
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaCreacion"), hasta));
            }

            if (StringUtils.hasText(filtro.getTipoMovimiento())) {
                String tipo = filtro.getTipoMovimiento().trim().toLowerCase();

                if ("entrada".equals(tipo) || "entradas".equals(tipo) || "positivo".equals(tipo) || "positivos".equals(tipo)) {
                    predicates.add(cb.greaterThan(root.get("cantidadAjuste"), BigDecimal.ZERO));
                } else if ("salida".equals(tipo) || "salidas".equals(tipo) || "negativo".equals(tipo) || "negativos".equals(tipo)) {
                    predicates.add(cb.lessThan(root.get("cantidadAjuste"), BigDecimal.ZERO));
                }
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
