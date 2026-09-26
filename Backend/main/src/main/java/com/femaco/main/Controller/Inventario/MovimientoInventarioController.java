package com.femaco.main.Controller.Inventario;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Inventario.MovimientoInventario;
import com.femaco.main.Service.Inventario.MovimientoInventarioService;

@RestController
@RequestMapping("/movimientoInventario")
public class MovimientoInventarioController {
    
     private final MovimientoInventarioService movimientoInventarioService;

    public MovimientoInventarioController(MovimientoInventarioService movimientoInventarioService) {
        this.movimientoInventarioService = movimientoInventarioService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<MovimientoInventario>> buscar() {
        return ResponseEntity.ok(movimientoInventarioService.buscarTodos());
    }

    @GetMapping("/buscar-paginado")
    public ResponseEntity<Page<MovimientoInventario>> buscarPaginado(
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(movimientoInventarioService.buscarTodosPaginado(pageable));
    }
/* 
    @GetMapping("/buscar/articulo/{idArticulo}")
    public ResponseEntity<List<MovimientoInventario>> buscarPorArticulo(@PathVariable Long idArticulo) {
        return ResponseEntity.ok(movimientoInventarioService.buscarPorArticulo(idArticulo));
    }

    @GetMapping("/buscar/venta/{idVenta}")
    public ResponseEntity<List<MovimientoInventario>> buscarPorVenta(@PathVariable Long idVenta) {
        return ResponseEntity.ok(movimientoInventarioService.buscarPorVenta(idVenta));
    }

    @GetMapping("/buscar/orden-compra/{idOrdenCompra}")
    public ResponseEntity<List<MovimientoInventario>> buscarPorOrdenCompra(@PathVariable Long idOrdenCompra) {
        return ResponseEntity.ok(movimientoInventarioService.buscarPorOrdenCompra(idOrdenCompra));
    }
*/
}
