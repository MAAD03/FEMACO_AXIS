package com.femaco.main.Repository.Suministro;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Suministro.OrdenCompraDetalle;

@Repository("ordenCompraDetalleRepository")
public interface OrdenCompraDetalleRepository extends JpaRepository<OrdenCompraDetalle, Long> {

    List<OrdenCompraDetalle> findByIdOrdenCompra(Long idOrdenCompra);
}
