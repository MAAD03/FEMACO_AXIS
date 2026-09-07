package com.femaco.main.Service.Inventario;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.femaco.main.DTOs.ArticuloFiltroDTO;
import com.femaco.main.Entity.Inventario.Articulo;

import jakarta.persistence.criteria.Predicate;


public class ArticuloSpecification {

    public static Specification<Articulo> conFiltros(ArticuloFiltroDTO filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Búsqueda de texto (código o nombre)
            if (StringUtils.hasText(filtro.getQ())) {
                String like = "%" + filtro.getQ().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("codigo")), like),
                    cb.like(cb.lower(root.get("nombre")), like),
                    cb.like(cb.lower(root.get("descripcion")), like)
                ));
            }
            if (filtro.getIdArea() != null) {
                predicates.add(cb.equal(root.get("idAreaArticulo"), filtro.getIdArea()));
            }
            if (filtro.getIdEstado() != null) {
                predicates.add(cb.equal(root.get("idEstadoArticulo"), filtro.getIdEstado()));
            }
            if (filtro.getIdUnidad() != null) {
                predicates.add(cb.equal(root.get("idUnidadMedida"), filtro.getIdUnidad()));
            }

            // Stock bajo: StockActual <= StockMinimo
            if (Boolean.TRUE.equals(filtro.getStockBajo())) {
                predicates.add(cb.lessThanOrEqualTo(
                    root.get("stockActual"),
                    root.get("stockMinimo")
                ));
            }
            // Sin stock
            if (Boolean.TRUE.equals(filtro.getSinStock())) {
                predicates.add(cb.lessThanOrEqualTo(
                    root.get("stockActual"),
                    java.math.BigDecimal.ZERO
                ));
            }
            // Rango de stock
            if (filtro.getStockMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("stockActual"), filtro.getStockMin()));
            }
            if (filtro.getStockMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("stockActual"), filtro.getStockMax()));
            }
            // Rango de precio
            if (filtro.getPrecioMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                    root.get("precioCompraUltimoProveedor"), filtro.getPrecioMin()));
            }
            if (filtro.getPrecioMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                    root.get("precioCompraUltimoProveedor"), filtro.getPrecioMax()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
    
}
