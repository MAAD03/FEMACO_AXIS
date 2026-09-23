package com.femaco.main.Service.SucursalCotizacion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.SucursalCotizacion.Sucursal;
import com.femaco.main.Repository.SucursalCotizacion.SucursalRepository;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;

    public SucursalService(SucursalRepository sucursalRepository) {
        this.sucursalRepository = sucursalRepository;
    }

    public List<Sucursal> buscarTodos() {
        return sucursalRepository.findAll();
    }

    @Transactional
    public Sucursal crear(Sucursal sucursal) {
        LocalDateTime ahora = LocalDateTime.now();
        sucursal.setIdSucursal(null);
        sucursal.setFechaCreacion(ahora);
        sucursal.setFechaModif(ahora);
        sucursal.setUsuarioModif(sucursal.getUsuarioCreacion());
        return sucursalRepository.save(sucursal);
    }

    @Transactional
    public Optional<Sucursal> actualizar(Long idSucursal, Sucursal datosNuevos) {
        return sucursalRepository.findById(idSucursal).map(existente -> {
            existente.setNombre(datosNuevos.getNombre());
            existente.setDireccion(datosNuevos.getDireccion());
            existente.setTelefono(datosNuevos.getTelefono());
            existente.setFelNitEmisor(datosNuevos.getFelNitEmisor());
            existente.setFelNombreEmisor(datosNuevos.getFelNombreEmisor());
            existente.setFelNombreComercial(datosNuevos.getFelNombreComercial());
            existente.setFelCorreoEmisor(datosNuevos.getFelCorreoEmisor());
            existente.setFelCodigoEstablecimiento(datosNuevos.getFelCodigoEstablecimiento());
            existente.setFelAfiliacionIva(datosNuevos.getFelAfiliacionIva());
            existente.setFelDireccion(datosNuevos.getFelDireccion());
            existente.setFelCodigoPostal(datosNuevos.getFelCodigoPostal());
            existente.setFelMunicipio(datosNuevos.getFelMunicipio());
            existente.setFelDepartamento(datosNuevos.getFelDepartamento());
            existente.setFelPais(datosNuevos.getFelPais());
            existente.setFelTipoFrase(datosNuevos.getFelTipoFrase());
            existente.setFelCodigoEscenario(datosNuevos.getFelCodigoEscenario());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return sucursalRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idSucursal) {
        if (!sucursalRepository.existsById(idSucursal)) {
            return false;
        }
        sucursalRepository.deleteById(idSucursal);
        return true;
    }
    
}
