package com.femaco.main.Repository.Suministro;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.femaco.main.DTOs.ProveedorResumenDTO;
import com.femaco.main.Entity.Suministro.Proveedor;

@Repository("proveedorRepository")
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    @Query("select new com.femaco.main.DTOs.ProveedorResumenDTO(p.idProveedor, p.nombre) from Proveedor p")
    List<ProveedorResumenDTO> findAllResumen();

    List<Proveedor> findByIdEstadoProveedor(Long idEstadoProveedor);
}
