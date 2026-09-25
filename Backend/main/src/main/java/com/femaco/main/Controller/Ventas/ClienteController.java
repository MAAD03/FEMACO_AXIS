package com.femaco.main.Controller.Ventas;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Ventas.Cliente;
import com.femaco.main.Service.Ventas.ClienteService;

@RestController
@RequestMapping("/cliente")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Cliente>> buscar() {
        return ResponseEntity.ok(clienteService.buscarTodos());
    }

    @GetMapping("/buscar-paginado")
    public ResponseEntity<Page<Cliente>> buscarPaginado(Pageable pageable) {
        return ResponseEntity.ok(clienteService.buscarTodosPaginado(pageable));
    }

    @GetMapping("/buscar-por-nit/{nit}")
    public ResponseEntity<Cliente> buscarPorNit(@PathVariable String nit) {
        return clienteService.buscarPorNit(nit)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/crear")
    public ResponseEntity<Cliente> crear(@RequestBody Cliente cliente) {
        Cliente creado = clienteService.crear(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idCliente}")
    public ResponseEntity<Cliente> editar(@PathVariable Long idCliente,
                                           @RequestBody Cliente cliente) {
        return clienteService.actualizar(idCliente, cliente)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idCliente}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idCliente) {
        boolean eliminado = clienteService.eliminar(idCliente);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
