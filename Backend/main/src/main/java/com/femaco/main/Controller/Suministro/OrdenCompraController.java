package com.femaco.main.Controller.Suministro;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.OrdenCompraCreateDTO;
import com.femaco.main.Entity.Suministro.OrdenCompra;
import com.femaco.main.Service.Suministro.OrdenCompraService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ordenCompra")
public class OrdenCompraController {

    private final OrdenCompraService ordenCompraService;

    public OrdenCompraController(OrdenCompraService ordenCompraService) {
        this.ordenCompraService = ordenCompraService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<OrdenCompra>> buscar() {
        return ResponseEntity.ok(ordenCompraService.buscarTodos());
    }

     @PostMapping("/crear-con-detalles")
    public ResponseEntity<OrdenCompra> crearConDetalles(@Valid @RequestBody OrdenCompraCreateDTO dto) {
        OrdenCompra creada = ordenCompraService.crearConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }
    /* 
    @PostMapping("/crear")
    public ResponseEntity<OrdenCompra> crear(@RequestBody OrdenCompra ordenCompra) {
        OrdenCompra creado = ordenCompraService.crear(ordenCompra);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idOrdenCompra}")
    public ResponseEntity<OrdenCompra> editar(@PathVariable Long idOrdenCompra,
                                                @RequestBody OrdenCompra ordenCompra) {
        return ordenCompraService.actualizar(idOrdenCompra, ordenCompra)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idOrdenCompra}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idOrdenCompra) {
        boolean eliminado = ordenCompraService.eliminar(idOrdenCompra);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    */
}
