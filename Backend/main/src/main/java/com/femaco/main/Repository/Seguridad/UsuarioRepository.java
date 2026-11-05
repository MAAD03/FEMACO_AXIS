package com.femaco.main.Repository.Seguridad;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.femaco.main.DTOs.UsuarioResumenDTO;
import com.femaco.main.Entity.Seguridad.Usuario;

@Repository("usuarioRepository")
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @Query("select new com.femaco.main.DTOs.UsuarioResumenDTO(u.idUsuario, u.correoElectronico) from Usuario u")
    List<UsuarioResumenDTO> findAllResumen();

    Optional<Usuario> findByCorreoElectronico(String correoElectronico);
}
