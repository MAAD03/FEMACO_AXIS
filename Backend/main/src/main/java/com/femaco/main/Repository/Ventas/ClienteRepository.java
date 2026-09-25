package com.femaco.main.Repository.Ventas;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.femaco.main.Entity.Ventas.Cliente;

@Repository("clienteRepository")
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByNit(String nit);

    boolean existsByNit(String nit);

}
