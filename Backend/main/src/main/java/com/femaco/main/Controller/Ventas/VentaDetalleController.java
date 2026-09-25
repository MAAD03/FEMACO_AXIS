package com.femaco.main.Controller.Ventas;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Service.Ventas.VentaDetalleService;

@RestController
@RequestMapping("/ventaDetalle")
public class VentaDetalleController {

    private final VentaDetalleService ventaDetalleService;

    public VentaDetalleController(VentaDetalleService ventaDetalleService) {
        this.ventaDetalleService = ventaDetalleService;
    }
    /* 

    @GetMapping("/buscar")
    public ResponseEntity<List<VentaDetalle>> buscar() {
        return ResponseEntity.ok(ventaDetalleService.buscarTodos());
    }

    @PostMapping("/crear")
    public ResponseEntity<VentaDetalle> crear(@RequestBody VentaDetalle ventaDetalle) {
        VentaDetalle creado = ventaDetalleService.crear(ventaDetalle);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idVentaDetalle}")
    public ResponseEntity<VentaDetalle> editar(@PathVariable Long idVentaDetalle,
                                                   @RequestBody VentaDetalle ventaDetalle) {
        return ventaDetalleService.actualizar(idVentaDetalle, ventaDetalle)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idVentaDetalle}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idVentaDetalle) {
        boolean eliminado = ventaDetalleService.eliminar(idVentaDetalle);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    */
}
