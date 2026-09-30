package com.femaco.main.Controller.SucursalCotizacion;

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

import com.femaco.main.Entity.SucursalCotizacion.Sucursal;
import com.femaco.main.Service.SucursalCotizacion.SucursalService;

@RestController
@RequestMapping("/sucursal")
public class SucursalController {

    private final SucursalService sucursalService;

    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAuthority('PERMISO_SUCURSAL_ACCESO')")
    public ResponseEntity<List<Sucursal>> buscar() {
        return ResponseEntity.ok(sucursalService.buscarTodos());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_SUCURSAL_ALTA')")
    public ResponseEntity<Sucursal> crear(@RequestBody Sucursal sucursal) {
        Sucursal creado = sucursalService.crear(sucursal);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idSucursal}")
    @PreAuthorize("hasAuthority('PERMISO_SUCURSAL_CAMBIO')")
    public ResponseEntity<Sucursal> editar(@PathVariable Long idSucursal,
                                              @RequestBody Sucursal sucursal) {
        return sucursalService.actualizar(idSucursal, sucursal)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idSucursal}")
    @PreAuthorize("hasAuthority('PERMISO_SUCURSAL_BAJA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long idSucursal) {
        boolean eliminado = sucursalService.eliminar(idSucursal);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
