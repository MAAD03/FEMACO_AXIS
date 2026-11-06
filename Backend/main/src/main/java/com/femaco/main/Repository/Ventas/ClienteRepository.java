package com.femaco.main.Repository.Ventas;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.femaco.main.DTOs.ClienteResumenDTO;
import com.femaco.main.Entity.Ventas.Cliente;

@Repository("clienteRepository")
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("select new com.femaco.main.DTOs.ClienteResumenDTO(c.idCliente, c.nombre, c.nit) from Cliente c")
    List<ClienteResumenDTO> findAllResumen();

    Optional<Cliente> findByNit(String nit);

    boolean existsByNit(String nit);

}
