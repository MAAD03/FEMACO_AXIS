package com.femaco.main.Repository.Inventario;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.femaco.main.DTOs.AreaArticuloResumenDTO;
import com.femaco.main.Entity.Inventario.AreaArticulo;

@Repository("areaArticuloRepository")
public interface AreaArticuloRepository extends JpaRepository<AreaArticulo, Long> {

    @Query("select new com.femaco.main.DTOs.AreaArticuloResumenDTO(a.idAreaArticulo, a.nombre) "
            + "from AreaArticulo a")
    List<AreaArticuloResumenDTO> findAllResumen();
}
