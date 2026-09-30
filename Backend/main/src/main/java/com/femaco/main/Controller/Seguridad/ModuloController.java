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

import com.femaco.main.Entity.Seguridad.Modulo;
import com.femaco.main.Service.Seguridad.ModuloService;

@RestController
@RequestMapping("/modulo")
public class ModuloController {

    private final ModuloService moduloService;

    public ModuloController(ModuloService moduloService) {
        this.moduloService = moduloService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Modulo>> buscar() {
        return ResponseEntity.ok(moduloService.buscarTodos());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_MODULO_ALTA')")
    public ResponseEntity<Modulo> crear(@RequestBody Modulo modulo) {
        Modulo creado = moduloService.crear(modulo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idModulo}")
    @PreAuthorize("hasAuthority('PERMISO_MODULO_CAMBIO')")
    public ResponseEntity<Modulo> editar(@PathVariable Long idModulo,
                                                   @RequestBody Modulo datosNuevos) {
        return moduloService.actualizar(idModulo, datosNuevos)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idModulo}")
    @PreAuthorize("hasAuthority('PERMISO_MODULO_BAJA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long idModulo) {
        boolean eliminado = moduloService.eliminar(idModulo);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
