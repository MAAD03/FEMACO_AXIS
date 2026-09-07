package com.femaco.main.Controller.Inventario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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

import com.femaco.main.DTOs.ArticuloFiltroDTO;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Service.Inventario.ArticuloService;

@RestController
@RequestMapping("/articulo")
public class ArticuloController {
    
    private final ArticuloService articuloService;

    public ArticuloController(ArticuloService articuloService) {
        this.articuloService = articuloService;
    }

/* 
    @GetMapping("/buscar")
    public ResponseEntity<List<Articulo>> buscar() {
        return ResponseEntity.ok(articuloService.buscarTodos());
    }
*/

  @GetMapping("/buscar-paginado")
    public ResponseEntity<Page<Articulo>> buscarPaginado(
            ArticuloFiltroDTO filtro,
            @PageableDefault(size = 20, sort = "nombre", direction = Sort.Direction.ASC)
            Pageable pageable) {

        Page<Articulo> resultado = articuloService.buscarConFiltros(filtro, pageable);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/crear")
    public ResponseEntity<Articulo> crear(@RequestBody Articulo articulo) {
        Articulo creado = articuloService.crear(articulo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idArticulo}")
    public ResponseEntity<Articulo> editar(@PathVariable Long idArticulo,
                                              @RequestBody Articulo articulo) {
        return articuloService.actualizar(idArticulo, articulo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idArticulo}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idArticulo) {
        boolean eliminado = articuloService.eliminar(idArticulo);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

}
