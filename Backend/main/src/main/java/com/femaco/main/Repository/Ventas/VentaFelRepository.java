package com.femaco.main.Repository.Ventas;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Ventas.VentaFel;

@Repository("ventaFelRepository")
public interface VentaFelRepository extends JpaRepository<VentaFel, Long> {

    Optional<VentaFel> findByIdVenta(Long idVenta);

}
