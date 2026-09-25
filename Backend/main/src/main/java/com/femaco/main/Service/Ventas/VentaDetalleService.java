package com.femaco.main.Service.Ventas;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Ventas.VentaDetalle;
import com.femaco.main.Repository.Ventas.VentaDetalleRepository;

@Service
public class VentaDetalleService {

    private final VentaDetalleRepository ventaDetalleRepository;

    public VentaDetalleService(VentaDetalleRepository ventaDetalleRepository) {
        this.ventaDetalleRepository = ventaDetalleRepository;
    }

    public List<VentaDetalle> buscarTodos() {
        return ventaDetalleRepository.findAll();
    }

    @Transactional
    public VentaDetalle crear(VentaDetalle ventaDetalle) {
        LocalDateTime ahora = LocalDateTime.now();
        ventaDetalle.setIdVentaDetalle(null);
        ventaDetalle.setFechaCreacion(ahora);
        ventaDetalle.setFechaModif(ahora);
        ventaDetalle.setUsuarioModif(ventaDetalle.getUsuarioCreacion());
        return ventaDetalleRepository.save(ventaDetalle);
    }

    @Transactional
    public Optional<VentaDetalle> actualizar(Long idVentaDetalle, VentaDetalle datosNuevos) {
        return ventaDetalleRepository.findById(idVentaDetalle).map(existente -> {
            existente.setCantidad(datosNuevos.getCantidad());
            existente.setPrecioUnitario(datosNuevos.getPrecioUnitario());
            existente.setSubtotalBruto(datosNuevos.getSubtotalBruto());
            existente.setPorcDescuentoMayorista(datosNuevos.getPorcDescuentoMayorista());
            existente.setMontoDescuentoMayorista(datosNuevos.getMontoDescuentoMayorista());
            existente.setPorcDescuentoManual(datosNuevos.getPorcDescuentoManual());
            existente.setMontoDescuentoManual(datosNuevos.getMontoDescuentoManual());
            existente.setSubtotal(datosNuevos.getSubtotal());
            existente.setIdVenta(datosNuevos.getIdVenta());
            existente.setIdArticulo(datosNuevos.getIdArticulo());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return ventaDetalleRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idVentaDetalle) {
        if (!ventaDetalleRepository.existsById(idVentaDetalle)) {
            return false;
        }
        ventaDetalleRepository.deleteById(idVentaDetalle);
        return true;
    }
    
}
