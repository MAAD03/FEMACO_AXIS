package com.femaco.main.Controller.Ventas;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Service.Ventas.VentaFelService;

@RestController
@RequestMapping("/ventaFel")
public class VentaFelController {

    private final VentaFelService ventaFelService;

    public VentaFelController(VentaFelService ventaFelService) {
        this.ventaFelService = ventaFelService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<VentaFel>> buscar() {
        return ResponseEntity.ok(ventaFelService.buscarTodos());
    }

    @GetMapping("/buscarPorId/{idVentaFel}")
    public ResponseEntity<VentaFel> buscarPorId(@PathVariable Long idVentaFel) {
        return ventaFelService.buscarPorId(idVentaFel)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/buscarPorIdVenta/{idVenta}")
    public ResponseEntity<VentaFel> buscarPorIdVenta(@PathVariable Long idVenta) {
        return ventaFelService.buscarPorIdVenta(idVenta)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

}
