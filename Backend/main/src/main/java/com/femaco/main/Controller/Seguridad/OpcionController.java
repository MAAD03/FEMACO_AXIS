package com.femaco.main.Controller.Seguridad;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Seguridad.Opcion;
import com.femaco.main.Service.Seguridad.OpcionService;

@RestController
@RequestMapping("/opcion")
public class OpcionController {

    private final OpcionService opcionService;

    public OpcionController(OpcionService opcionService) {
        this.opcionService = opcionService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Opcion>> buscar() {
        return ResponseEntity.ok(opcionService.buscarTodos());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_OPCION_ALTA')")
    public ResponseEntity<Opcion> crear(@RequestBody Opcion opcion) {
        Opcion creada = opcionService.crear(opcion);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/editar/{idOpcion}")
    @PreAuthorize("hasAuthority('PERMISO_OPCION_CAMBIO')")
    public ResponseEntity<Opcion> editar(@PathVariable Long idOpcion,
                                           @RequestBody Opcion opcion) {
        return opcionService.actualizar(idOpcion, opcion)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idOpcion}")
    @PreAuthorize("hasAuthority('PERMISO_OPCION_BAJA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long idOpcion) {
        boolean eliminado = opcionService.eliminar(idOpcion);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
