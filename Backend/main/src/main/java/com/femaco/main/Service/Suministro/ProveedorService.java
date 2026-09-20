package com.femaco.main.Service.Suministro;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Suministro.Proveedor;
import com.femaco.main.Repository.Suministro.ProveedorRepository;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    public List<Proveedor> buscarTodos() {
        return proveedorRepository.findAll();
    }

    public List<Proveedor> buscarProveedores() {
        return proveedorRepository.findByIdEstadoProveedor(1L);
    }

    @Transactional
    public Proveedor crear(Proveedor proveedor) {
        LocalDateTime ahora = LocalDateTime.now();
        proveedor.setIdProveedor(null);
        proveedor.setFechaCreacion(ahora);
        proveedor.setFechaModif(ahora);
        proveedor.setUsuarioModif(proveedor.getUsuarioCreacion());
        return proveedorRepository.save(proveedor);
    }

    @Transactional
    public Optional<Proveedor> actualizar(Long idProveedor, Proveedor datosNuevos) {
        return proveedorRepository.findById(idProveedor).map(existente -> {
            existente.setNombre(datosNuevos.getNombre());
            existente.setNit(datosNuevos.getNit());
            existente.setTelefono(datosNuevos.getTelefono());
            existente.setDireccion(datosNuevos.getDireccion());
            existente.setNombreContacto(datosNuevos.getNombreContacto());
            existente.setIdEstadoProveedor(datosNuevos.getIdEstadoProveedor());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return proveedorRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idProveedor) {
        if (!proveedorRepository.existsById(idProveedor)) {
            return false;
        }
        proveedorRepository.deleteById(idProveedor);
        return true;
    }
    
}
