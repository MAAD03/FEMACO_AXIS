package com.femaco.main.Repository.Inventario;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Inventario.MovimientoInventario;

@Repository("movimientoInventarioRepository")
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    List<MovimientoInventario> findByIdArticulo(Long idArticulo);

    List<MovimientoInventario> findByIdVenta(Long idVenta);

    List<MovimientoInventario> findByIdOrdenCompra(Long idOrdenCompra);

    Page<MovimientoInventario> findAllByOrderByFechaCreacionDescIdMovimientoInventarioDesc(Pageable pageable);
    
}
