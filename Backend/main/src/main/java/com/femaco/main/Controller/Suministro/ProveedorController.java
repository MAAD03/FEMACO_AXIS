package com.femaco.main.Controller.Suministro;

import java.util.List;

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

import com.femaco.main.Entity.Suministro.Proveedor;
import com.femaco.main.Service.Suministro.ProveedorService;

@RestController
@RequestMapping("/proveedor")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Proveedor>> buscar() {
        return ResponseEntity.ok(proveedorService.buscarTodos());
    }

    @GetMapping("/buscarProveedores")
    public ResponseEntity<List<Proveedor>> buscarProveedores() {
        return ResponseEntity.ok(proveedorService.buscarProveedores());
    }

    @PostMapping("/crear")
    public ResponseEntity<Proveedor> crear(@RequestBody Proveedor proveedor) {
        Proveedor creado = proveedorService.crear(proveedor);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idProveedor}")
    public ResponseEntity<Proveedor> editar(@PathVariable Long idProveedor,
                                              @RequestBody Proveedor proveedor) {
        return proveedorService.actualizar(idProveedor, proveedor)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idProveedor}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idProveedor) {
        boolean eliminado = proveedorService.eliminar(idProveedor);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
