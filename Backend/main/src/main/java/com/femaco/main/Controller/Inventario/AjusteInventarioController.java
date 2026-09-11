package com.femaco.main.Controller.Inventario;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.AjusteInventarioFiltroDTO;
import com.femaco.main.DTOs.AjusteInventarioRequestDTO;
import com.femaco.main.Entity.Inventario.AjusteInventario;
import com.femaco.main.Service.Inventario.AjusteInventarioService;

@RestController
@RequestMapping("/ajusteInventario")
public class AjusteInventarioController {

     private final AjusteInventarioService ajusteInventarioService;

    public AjusteInventarioController(AjusteInventarioService ajusteInventarioService) {
        this.ajusteInventarioService = ajusteInventarioService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<AjusteInventario>> buscar() {
        return ResponseEntity.ok(ajusteInventarioService.buscarTodos());
    }

    @GetMapping("/buscar-paginado")
    public ResponseEntity<Page<AjusteInventario>> buscarPaginado(
            AjusteInventarioFiltroDTO filtro,
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<AjusteInventario> resultado = ajusteInventarioService.buscarConFiltros(filtro, pageable);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/crear")
    public ResponseEntity<AjusteInventario> crear(@RequestBody AjusteInventarioRequestDTO ajusteInventarioRequestDTO) {
        AjusteInventario creado = ajusteInventarioService.crear(ajusteInventarioRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }
/* 
    @PutMapping("/editar/{idAjusteInventario}")
    public ResponseEntity<AjusteInventario> editar(@PathVariable Long idAjusteInventario,
                                                   @RequestBody AjusteInventario ajusteInventario) {
        return ajusteInventarioService.actualizar(idAjusteInventario, ajusteInventario)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idAjusteInventario}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idAjusteInventario) {
        boolean eliminado = ajusteInventarioService.eliminar(idAjusteInventario);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    */
}
