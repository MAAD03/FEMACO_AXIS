package com.femaco.main.Controller.Dashboard;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.Dashboard.Agrupacion;
import com.femaco.main.DTOs.Dashboard.HistorialMovimientoDTO;
import com.femaco.main.DTOs.Dashboard.MovimientoPeriodoDTO;
import com.femaco.main.DTOs.Dashboard.OrdenRotacion;
import com.femaco.main.DTOs.Dashboard.PaginaDTO;
import com.femaco.main.DTOs.Dashboard.RotacionDTO;
import com.femaco.main.DTOs.Dashboard.StockBajoDTO;
import com.femaco.main.Service.Dashboard.InventarioDashboardService;

@RestController
@RequestMapping("/dashboard/inventario")
public class InventarioDashboardController {

    private final InventarioDashboardService service;

    public InventarioDashboardController(InventarioDashboardService service) {
        this.service = service;
    }

    @GetMapping("/stock-bajo")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_ARTICULOS_ACCESO')")
    public ResponseEntity<List<StockBajoDTO>> stockBajo() {
        return ResponseEntity.ok(service.stockBajoMinimo());
    }

    @GetMapping("/movimientos")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_ARTICULOS_ACCESO')")
    public ResponseEntity<List<MovimientoPeriodoDTO>> movimientos(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "DIA") Agrupacion agrupacion) {
        return ResponseEntity.ok(service.movimientosPorPeriodo(desde, hasta, agrupacion));
    }

    @GetMapping("/articulos/{idArticulo}/movimientos")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_ARTICULOS_ACCESO')")
    public ResponseEntity<PaginaDTO<HistorialMovimientoDTO>> historial(
            @PathVariable Long idArticulo,
            @RequestParam(required = false) Integer pagina,
            @RequestParam(required = false) Integer tamanio) {
        return ResponseEntity.ok(service.historialArticulo(idArticulo, pagina, tamanio));
    }

    @GetMapping("/rotacion")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_ARTICULOS_ACCESO')")
    public ResponseEntity<List<RotacionDTO>> rotacion(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "MAS_MOVIDOS") OrdenRotacion orden,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(service.rotacion(desde, hasta, orden, limite));
    }
}
