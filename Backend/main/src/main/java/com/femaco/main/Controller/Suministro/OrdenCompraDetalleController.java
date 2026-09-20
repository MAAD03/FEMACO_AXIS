package com.femaco.main.Controller.Suministro;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Service.Suministro.OrdenCompraDetalleService;

@RestController
@RequestMapping("/ordenCompraDetalle")
public class OrdenCompraDetalleController {

    private final OrdenCompraDetalleService ordenCompraService;

    public OrdenCompraDetalleController(OrdenCompraDetalleService ordenCompraService) {
        this.ordenCompraService = ordenCompraService;
    }
/* 
    @GetMapping("/buscar")
    public ResponseEntity<List<OrdenCompraDetalle>> buscar() {
        return ResponseEntity.ok(ordenCompraService.buscarTodos());
    }

    @PostMapping("/crear")
    public ResponseEntity<OrdenCompraDetalle> crear(@RequestBody OrdenCompraDetalle ordenCompra) {
        OrdenCompraDetalle creado = ordenCompraService.crear(ordenCompra);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idOrdenCompra}")
    public ResponseEntity<OrdenCompraDetalle> editar(@PathVariable Long idOrdenCompra,
                                                        @RequestBody OrdenCompraDetalle ordenCompra) {
        return ordenCompraService.actualizar(idOrdenCompra, ordenCompra)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idOrdenCompraDetalle}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idOrdenCompraDetalle) {
        boolean eliminado = ordenCompraService.eliminar(idOrdenCompraDetalle);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    */
}
