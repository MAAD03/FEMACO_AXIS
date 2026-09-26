package com.femaco.main.Repository.SucursalCotizacion;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.SucursalCotizacion.Cotizacion;

@Repository("cotizacionRepository")
public interface CotizacionRepository extends JpaRepository<Cotizacion, Long> {

	Optional<Cotizacion> findByNit(String nit);
    
}
