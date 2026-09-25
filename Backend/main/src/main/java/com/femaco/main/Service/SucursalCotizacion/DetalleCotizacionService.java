package com.femaco.main.Service.SucursalCotizacion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.SucursalCotizacion.DetalleCotizacion;
import com.femaco.main.Repository.SucursalCotizacion.DetalleCotizacionRepository;

@Service
public class DetalleCotizacionService {
    
    private final DetalleCotizacionRepository detalleCotizacionRepository;

    public DetalleCotizacionService(DetalleCotizacionRepository detalleCotizacionRepository) {
        this.detalleCotizacionRepository = detalleCotizacionRepository;
    }

    public List<DetalleCotizacion> buscarTodos() {
        return detalleCotizacionRepository.findAll();
    }

    @Transactional
    public DetalleCotizacion crear(DetalleCotizacion detalleCotizacion) {
        LocalDateTime ahora = LocalDateTime.now();
        detalleCotizacion.setIdDetalleCotizacion(null);
        detalleCotizacion.setFechaCreacion(ahora);
        detalleCotizacion.setFechaModif(ahora);
        detalleCotizacion.setUsuarioModif(detalleCotizacion.getUsuarioCreacion());
        return detalleCotizacionRepository.save(detalleCotizacion);
    }

    @Transactional
    public Optional<DetalleCotizacion> actualizar(Long idDetalleCotizacion, DetalleCotizacion datosNuevos) {
        return detalleCotizacionRepository.findById(idDetalleCotizacion).map(existente -> {
            existente.setCantidad(datosNuevos.getCantidad());
            existente.setPrecioUnitario(datosNuevos.getPrecioUnitario());
            existente.setSubtotalBruto(datosNuevos.getSubtotalBruto());
            existente.setPorcDescuentoMayorista(datosNuevos.getPorcDescuentoMayorista());
            existente.setMontoDescuentoMayorista(datosNuevos.getMontoDescuentoMayorista());
            existente.setPorcDescuentoManual(datosNuevos.getPorcDescuentoManual());
            existente.setMontoDescuentoManual(datosNuevos.getMontoDescuentoManual());
            existente.setSubtotal(datosNuevos.getSubtotal());
            existente.setIdCotizacion(datosNuevos.getIdCotizacion());
            existente.setIdArticulo(datosNuevos.getIdArticulo());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return detalleCotizacionRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idDetalleCotizacion) {
        if (!detalleCotizacionRepository.existsById(idDetalleCotizacion)) {
            return false;
        }
        detalleCotizacionRepository.deleteById(idDetalleCotizacion);
        return true;
    }

}
