package com.femaco.main.Repository.SucursalCotizacion;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.SucursalCotizacion.DetalleCotizacion;

@Repository("detalleCotizacionRepository")
public interface DetalleCotizacionRepository extends JpaRepository<DetalleCotizacion, Long> {

	List<DetalleCotizacion> findByIdCotizacion(Long idCotizacion);
    
}
