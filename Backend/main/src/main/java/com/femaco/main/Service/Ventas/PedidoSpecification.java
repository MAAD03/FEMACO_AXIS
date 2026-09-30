package com.femaco.main.Service.Ventas;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.femaco.main.DTOs.PedidoFiltroDTO;
import com.femaco.main.Entity.Ventas.Cliente;
import com.femaco.main.Entity.Ventas.Pedido;
import com.femaco.main.Entity.Ventas.Venta;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public class PedidoSpecification {

    private PedidoSpecification() {
    }

    public static Specification<Pedido> conFiltros(PedidoFiltroDTO filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filtro.getIdPedido() != null) {
                predicates.add(cb.equal(root.get("idPedido"), filtro.getIdPedido()));
            }

            if (filtro.getIdVenta() != null) {
                predicates.add(cb.equal(root.get("idVenta"), filtro.getIdVenta()));
            }

            if (filtro.getIdEstadoPedido() != null) {
                predicates.add(cb.equal(root.get("idEstadoPedido"), filtro.getIdEstadoPedido()));
            }

            if (StringUtils.hasText(filtro.getQ())) {
                String like = "%" + filtro.getQ().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numeroEntrega")), like),
                        cb.like(cb.lower(root.get("direccionEntrega")), like),
                        cb.like(cb.lower(root.get("notasEntrega")), like),
                        cb.like(cb.lower(root.get("productoDePedido")), like)));
            }

            if (StringUtils.hasText(filtro.getNumeroEntrega())) {
                predicates.add(cb.equal(root.get("numeroEntrega"), filtro.getNumeroEntrega().trim()));
            }

            if (filtro.getFechaEntregaDesde() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaEntrega"), filtro.getFechaEntregaDesde()));
            }

            if (filtro.getFechaEntregaHasta() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaEntrega"), filtro.getFechaEntregaHasta()));
            }

            if (filtro.getFechaCreacionDesde() != null) {
                LocalDateTime desde = filtro.getFechaCreacionDesde().atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaCreacion"), desde));
            }

            if (filtro.getFechaCreacionHasta() != null) {
                LocalDateTime hasta = filtro.getFechaCreacionHasta().atTime(LocalTime.MAX);
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaCreacion"), hasta));
            }

            if (StringUtils.hasText(filtro.getNitCliente()) || StringUtils.hasText(filtro.getNumeroFactura())) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Venta> ventaRoot = subquery.from(Venta.class);
                List<Predicate> ventaPredicates = new ArrayList<>();

                if (StringUtils.hasText(filtro.getNitCliente())) {
                    Subquery<Long> clienteSubquery = query.subquery(Long.class);
                    Root<Cliente> clienteRoot = clienteSubquery.from(Cliente.class);
                    clienteSubquery.select(clienteRoot.get("idCliente"))
                            .where(cb.equal(cb.lower(clienteRoot.get("nit")), filtro.getNitCliente().trim().toLowerCase()));
                    ventaPredicates.add(ventaRoot.get("idCliente").in(clienteSubquery));
                }

                if (StringUtils.hasText(filtro.getNumeroFactura())) {
                    ventaPredicates.add(cb.equal(ventaRoot.get("numeroFactura"), filtro.getNumeroFactura().trim()));
                }

                subquery.select(ventaRoot.get("idVenta"))
                        .where(cb.and(ventaPredicates.toArray(Predicate[]::new)));
                predicates.add(root.get("idVenta").in(subquery));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}