package com.femaco.main.Controller.Inventario;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    @PreAuthorize("hasAuthority('PERMISO_MOVIMIENTO_INVENTARIO_ACCESO')")
    public ResponseEntity<List<MovimientoInventario>> buscar() {
        return ResponseEntity.ok(movimientoInventarioService.buscarTodos());
    }

    @GetMapping("/buscar-paginado")
    @PreAuthorize("hasAuthority('PERMISO_MOVIMIENTO_INVENTARIO_ACCESO')")
    public ResponseEntity<Page<MovimientoInventario>> buscarPaginado(
            @RequestParam(required = false) String tipoMovimiento,
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {
        if (tipoMovimiento == null) {
            return ResponseEntity.ok(movimientoInventarioService.buscarTodosPaginado(pageable));
        }

        if (!Set.of("entrada", "salida", "ajuste").contains(tipoMovimiento)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "tipoMovimiento debe ser entrada, salida o ajuste.");
        }

        return ResponseEntity.ok(
                movimientoInventarioService.buscarPorTipoMovimientoPaginado(tipoMovimiento, pageable));
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
