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

import com.femaco.main.Entity.Seguridad.Menu;
import com.femaco.main.Service.Seguridad.MenuService;

@RestController
@RequestMapping("/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Menu>> buscar() {
        return ResponseEntity.ok(menuService.buscarTodos());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_MENU_ALTA')")
    public ResponseEntity<Menu> crear(@RequestBody Menu menu) {
        Menu creado = menuService.crear(menu);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idMenu}")
    @PreAuthorize("hasAuthority('PERMISO_MENU_CAMBIO')")
    public ResponseEntity<Menu> editar(@PathVariable Long idMenu,
                                         @RequestBody Menu menu) {
        return menuService.actualizar(idMenu, menu)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idMenu}")
    @PreAuthorize("hasAuthority('PERMISO_MENU_BAJA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long idMenu) {
        boolean eliminado = menuService.eliminar(idMenu);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
}
