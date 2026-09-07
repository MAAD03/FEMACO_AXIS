package com.femaco.main.Repository.Inventario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Inventario.Articulo;

@Repository("articuloRepository")
public interface ArticuloRepository extends JpaRepository<Articulo, Long>, JpaSpecificationExecutor<Articulo>{
    
}
