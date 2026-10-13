package com.femaco.main.Service.Seguridad;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Seguridad.RolOpcion;
import com.femaco.main.Repository.Seguridad.RolOpcionRepository;

@Service
public class RolOpcionService {

    private final RolOpcionRepository rolOpcionRepository;

    public RolOpcionService(RolOpcionRepository rolOpcionRepository) {
        this.rolOpcionRepository = rolOpcionRepository;
    }

    public List<RolOpcion> buscarTodos() {
        return rolOpcionRepository.findAll();
    }

    public List<RolOpcion> buscarPorIdRol(Long idRol) {
        return rolOpcionRepository.findAllByIdRol(idRol);
    }

    @Transactional
    public RolOpcion crear(RolOpcion rolOpcion) {
        LocalDateTime ahora = LocalDateTime.now();
        rolOpcion.setIdRolOpcion(null);
        rolOpcion.setFechaCreacion(ahora);
        rolOpcion.setFechaModif(ahora);
        rolOpcion.setUsuarioModif(rolOpcion.getUsuarioCreacion());
        return rolOpcionRepository.save(rolOpcion);
    }

    @Transactional
    public Optional<RolOpcion> actualizar(Long idRolOpcion, RolOpcion datosNuevos) {
        return rolOpcionRepository.findById(idRolOpcion).map(existente -> {
            existente.setIdRol(datosNuevos.getIdRol());
            existente.setIdOpcion(datosNuevos.getIdOpcion());
            existente.setAlta(datosNuevos.getAlta());
            existente.setBaja(datosNuevos.getBaja());
            existente.setCambio(datosNuevos.getCambio());
            
            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return rolOpcionRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idRolOpcion) {
        if (!rolOpcionRepository.existsById(idRolOpcion)) {
            return false;
        }
        rolOpcionRepository.deleteById(idRolOpcion);
        return true;
    }
    
}
