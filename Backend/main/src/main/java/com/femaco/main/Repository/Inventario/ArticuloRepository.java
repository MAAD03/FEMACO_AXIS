package com.femaco.main.Repository.Inventario;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.femaco.main.DTOs.ArticuloResumenDTO;
import com.femaco.main.Entity.Inventario.Articulo;

@Repository("articuloRepository")
public interface ArticuloRepository extends JpaRepository<Articulo, Long>, JpaSpecificationExecutor<Articulo>{

    @Query("select new com.femaco.main.DTOs.ArticuloResumenDTO(a.idArticulo, a.nombre) from Articulo a")
    List<ArticuloResumenDTO> findAllResumen();

    List<Articulo> findAllByIdEstadoArticuloOrderByCodigoAsc(Long idEstadoArticulo);
    
}
