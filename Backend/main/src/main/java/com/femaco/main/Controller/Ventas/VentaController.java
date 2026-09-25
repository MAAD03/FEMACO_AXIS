package com.femaco.main.Controller.Ventas;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.VentaConDetallesDTO;
import com.femaco.main.DTOs.VentaCreateDTO;
import com.femaco.main.DTOs.VentaFiltroDTO;
import com.femaco.main.Entity.Ventas.Venta;
import com.femaco.main.Service.Ventas.VentaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping("/buscar-paginado")
    public ResponseEntity<Page<Venta>> buscarPaginado(
            VentaFiltroDTO filtro,
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {

        return ResponseEntity.ok(ventaService.buscarConFiltros(filtro, pageable));
    }

    @GetMapping("/buscar/{idVenta}")
    public ResponseEntity<VentaConDetallesDTO> buscarPorId(@PathVariable Long idVenta) {
        return ventaService.buscarPorIdConDetalles(idVenta)
                .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/crear-con-detalles")
    public ResponseEntity<Venta> crearConDetalles(@Valid @RequestBody VentaCreateDTO dto) {
        Venta creada = ventaService.crearConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/anular/{idVenta}")
    public ResponseEntity<Venta> anular(@PathVariable Long idVenta) {
        return ventaService.anular(idVenta)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
/* 
    @PostMapping("/crear")
    public ResponseEntity<Venta> crear(@RequestBody Venta venta) {
        Venta creada = ventaService.crear(venta);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @DeleteMapping("/eliminar/{idVenta}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idVenta) {
        boolean eliminado = ventaService.eliminar(idVenta);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Venta>> buscar() {
        return ResponseEntity.ok(ventaService.buscarTodos());
    }
*/
}
