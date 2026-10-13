package com.femaco.main.Repository.Seguridad;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Seguridad.RolOpcion;

@Repository("rolOpcionRepository")
public interface RolOpcionRepository extends JpaRepository<RolOpcion, Long> {

    List<RolOpcion> findAllByIdRol(Long idRol);
    
}
