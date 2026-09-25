package com.femaco.main.Service.SucursalCotizacion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.SucursalCotizacion.Cotizacion;
import com.femaco.main.Repository.SucursalCotizacion.CotizacionRepository;

@Service
public class CotizacionService {

    private final CotizacionRepository cotizacionRepository;

    public CotizacionService(CotizacionRepository cotizacionRepository) {
        this.cotizacionRepository = cotizacionRepository;
    }

    public List<Cotizacion> buscarTodos() {
        return cotizacionRepository.findAll();
    }

    @Transactional
    public Cotizacion crear(Cotizacion cotizacion) {
        LocalDateTime ahora = LocalDateTime.now();
        cotizacion.setIdCotizacion(null);
        cotizacion.setFechaCreacion(ahora);
        cotizacion.setFechaModif(ahora);
        cotizacion.setUsuarioModif(cotizacion.getUsuarioCreacion());
        return cotizacionRepository.save(cotizacion);
    }

    @Transactional
    public Optional<Cotizacion> actualizar(Long idCotizacion, Cotizacion datosNuevos) {
        return cotizacionRepository.findById(idCotizacion).map(existente -> {
            existente.setFecha(datosNuevos.getFecha());
            existente.setNombre(datosNuevos.getNombre());
            existente.setNit(datosNuevos.getNit());
            existente.setSubtotal(datosNuevos.getSubtotal());
            existente.setDescuentoMayoristaTotal(datosNuevos.getDescuentoMayoristaTotal());
            existente.setDescuentoManualTotal(datosNuevos.getDescuentoManualTotal());
            existente.setDescuentoTotal(datosNuevos.getDescuentoTotal());
            existente.setTotal(datosNuevos.getTotal());
            existente.setIdUsuario(datosNuevos.getIdUsuario());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return cotizacionRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idCotizacion) {
        if (!cotizacionRepository.existsById(idCotizacion)) {
            return false;
        }
        cotizacionRepository.deleteById(idCotizacion);
        return true;
    }
    
}
