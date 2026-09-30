package com.femaco.main.Controller.Inventario;

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

import com.femaco.main.Entity.Inventario.AreaArticulo;
import com.femaco.main.Service.Inventario.AreaArticuloService;

@RestController
@RequestMapping("/areaArticulo")
public class AreaArticuloController {
    
    private final AreaArticuloService areaArticuloService;

    public AreaArticuloController(AreaArticuloService areaArticuloService) {
        this.areaArticuloService = areaArticuloService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<AreaArticulo>> buscar() {
        return ResponseEntity.ok(areaArticuloService.buscarTodos());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_AREA_ARTICULO_ALTA')")
    public ResponseEntity<AreaArticulo> crear(@RequestBody AreaArticulo areaArticulo) {
        AreaArticulo creado = areaArticuloService.crear(areaArticulo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idAreaArticulo}")
    @PreAuthorize("hasAuthority('PERMISO_AREA_ARTICULO_CAMBIO')")
    public ResponseEntity<AreaArticulo> editar(@PathVariable Long idAreaArticulo,
                                                   @RequestBody AreaArticulo areaArticulo) {
        return areaArticuloService.actualizar(idAreaArticulo, areaArticulo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idAreaArticulo}")
    @PreAuthorize("hasAuthority('PERMISO_AREA_ARTICULO_BAJA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long idAreaArticulo) {
        boolean eliminado = areaArticuloService.eliminar(idAreaArticulo);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

}
