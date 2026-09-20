package com.femaco.main.Repository.Suministro;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Suministro.Proveedor;

@Repository("proveedorRepository")
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    List<Proveedor> findByIdEstadoProveedor(Long idEstadoProveedor);
}
