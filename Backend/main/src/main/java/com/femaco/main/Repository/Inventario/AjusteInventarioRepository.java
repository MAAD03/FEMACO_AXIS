package com.femaco.main.Repository.Inventario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Inventario.AjusteInventario;

@Repository("ajusteInventarioRepository")
public interface AjusteInventarioRepository extends JpaRepository<AjusteInventario, Long>, JpaSpecificationExecutor<AjusteInventario> {
    
}
