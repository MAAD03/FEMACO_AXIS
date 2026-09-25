package com.femaco.main.Service.Ventas;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.femaco.main.DTOs.VentaFiltroDTO;
import com.femaco.main.Entity.Ventas.Cliente;
import com.femaco.main.Entity.Ventas.Venta;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public class VentaSpecification {

    private VentaSpecification() {
    }

    public static Specification<Venta> conFiltros(VentaFiltroDTO filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filtro.getFechaCreacionDesde() != null) {
                LocalDateTime desde = filtro.getFechaCreacionDesde().atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaCreacion"), desde));
            }

            if (filtro.getFechaCreacionHasta() != null) {
                LocalDateTime hasta = filtro.getFechaCreacionHasta().atTime(LocalTime.MAX);
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaCreacion"), hasta));
            }

            if (StringUtils.hasText(filtro.getNitCliente())) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Cliente> clienteRoot = subquery.from(Cliente.class);

                subquery.select(clienteRoot.get("idCliente"))
                        .where(cb.equal(clienteRoot.get("nit"), filtro.getNitCliente().trim()));

                predicates.add(root.get("idCliente").in(subquery));
            }

            if (StringUtils.hasText(filtro.getNumeroFactura())) {
                predicates.add(cb.equal(root.get("numeroFactura"), filtro.getNumeroFactura().trim()));
            }

            if (filtro.getIdEstadoVenta() != null) {
                predicates.add(cb.equal(root.get("idEstadoVenta"), filtro.getIdEstadoVenta()));
            }

            if (filtro.getIdUsuario() != null) {
                predicates.add(cb.equal(root.get("idUsuario"), filtro.getIdUsuario()));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}