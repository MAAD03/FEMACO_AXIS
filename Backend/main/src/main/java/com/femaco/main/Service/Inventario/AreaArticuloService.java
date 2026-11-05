package com.femaco.main.Service.Inventario;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.DTOs.AreaArticuloResumenDTO;
import com.femaco.main.Entity.Inventario.AreaArticulo;
import com.femaco.main.Repository.Inventario.AreaArticuloRepository;



@Service
public class AreaArticuloService {
    
    private final AreaArticuloRepository areaArticuloRepository;

    public AreaArticuloService(AreaArticuloRepository areaArticuloRepository) {
        this.areaArticuloRepository = areaArticuloRepository;
    }

    public List<AreaArticuloResumenDTO> buscarTodos() {
        return areaArticuloRepository.findAllResumen();
    }

    @Transactional(readOnly = true)
    public Page<AreaArticulo> buscarTodos(Pageable pageable) {
        return areaArticuloRepository.findAll(pageable);
    }

    @Transactional
    public AreaArticulo crear(AreaArticulo areaArticulo) {
        LocalDateTime ahora = LocalDateTime.now();
        areaArticulo.setIdAreaArticulo(null);
        areaArticulo.setFechaCreacion(ahora);
        areaArticulo.setFechaModif(ahora);
        areaArticulo.setUsuarioModif(areaArticulo.getUsuarioCreacion());
        return areaArticuloRepository.save(areaArticulo);
    }

    @Transactional
    public Optional<AreaArticulo> actualizar(Long idAreaArticulo, AreaArticulo datosNuevos) {
        return areaArticuloRepository.findById(idAreaArticulo).map(existente -> {
            existente.setNombre(datosNuevos.getNombre());
            existente.setDescripcion(datosNuevos.getDescripcion());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return areaArticuloRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idAreaArticulo) {
        if (!areaArticuloRepository.existsById(idAreaArticulo)) {
            return false;
        }
        areaArticuloRepository.deleteById(idAreaArticulo);
        return true;
    }

}
