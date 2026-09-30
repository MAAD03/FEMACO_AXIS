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

import com.femaco.main.Entity.Seguridad.Rol;
import com.femaco.main.Service.Seguridad.RolService;

@RestController
@RequestMapping("/rol")
public class RolController {

    private final RolService rolService;

    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Rol>> buscar() {
        return ResponseEntity.ok(rolService.buscarTodos());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_ROL_ALTA')")
    public ResponseEntity<Rol> crear(@RequestBody Rol rol) {
        Rol creado = rolService.crear(rol);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idRol}")
    @PreAuthorize("hasAuthority('PERMISO_ROL_CAMBIO')")
    public ResponseEntity<Rol> editar(@PathVariable Long idRol,
                                       @RequestBody Rol rol) {
        return rolService.actualizar(idRol, rol)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idRol}")
    @PreAuthorize("hasAuthority('PERMISO_ROL_BAJA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long idRol) {
        boolean eliminado = rolService.eliminar(idRol);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
