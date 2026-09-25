package com.femaco.main.Service.Ventas;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Ventas.Cliente;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Repository.Ventas.ClienteRepository;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> buscarTodos() {
        return clienteRepository.findAll();
    }

    public Page<Cliente> buscarTodosPaginado(Pageable pageable) {
        return clienteRepository.findAll(pageable);
    }

    public Optional<Cliente> buscarPorNit(String nit) {
        return clienteRepository.findByNit(nit);
    }

    @Transactional
    public Cliente crear(Cliente cliente) {
        if (clienteRepository.existsByNit(cliente.getNit())) {
            throw new BusinessException("Este Nit ya esta registrado");
        }
        LocalDateTime ahora = LocalDateTime.now();
        cliente.setIdCliente(null);
        cliente.setFechaCreacion(ahora);
        cliente.setFechaModif(ahora);
        cliente.setUsuarioModif(cliente.getUsuarioCreacion());
        return clienteRepository.save(cliente);
    }

    @Transactional
    public Optional<Cliente> actualizar(Long idCliente, Cliente datosNuevos) {
        return clienteRepository.findById(idCliente).map(existente -> {
            existente.setNit(datosNuevos.getNit());
            existente.setNombre(datosNuevos.getNombre());
            existente.setTelefono(datosNuevos.getTelefono());
            existente.setCorreo(datosNuevos.getCorreo());
            existente.setIdEstadoCliente(datosNuevos.getIdEstadoCliente());
            existente.setDireccion(datosNuevos.getDireccion());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return clienteRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idCliente) {
        if (!clienteRepository.existsById(idCliente)) {
            return false;
        }
        clienteRepository.deleteById(idCliente);
        return true;
    }
    
}
