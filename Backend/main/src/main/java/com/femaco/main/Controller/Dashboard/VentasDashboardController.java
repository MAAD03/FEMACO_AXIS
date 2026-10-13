package com.femaco.main.Controller.Dashboard;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.Dashboard.Agrupacion;
import com.femaco.main.DTOs.Dashboard.OrdenTopProductos;
import com.femaco.main.DTOs.Dashboard.ResumenVentasDTO;
import com.femaco.main.DTOs.Dashboard.TopProductoDTO;
import com.femaco.main.DTOs.Dashboard.VentaClienteDTO;
import com.femaco.main.DTOs.Dashboard.VentaVendedorDTO;
import com.femaco.main.DTOs.Dashboard.VentasPeriodoDTO;
import com.femaco.main.Service.Dashboard.VentasDashboardService;

@RestController
@RequestMapping("/dashboard/ventas")
public class VentasDashboardController {

    private final VentasDashboardService service;

    public VentasDashboardController(VentasDashboardService service) {
        this.service = service;
    }

    @GetMapping("/por-periodo")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_VENTA_ACCESO')")
    public ResponseEntity<List<VentasPeriodoDTO>> porPeriodo(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "DIA") Agrupacion agrupacion) {
        return ResponseEntity.ok(service.ventasPorPeriodo(desde, hasta, agrupacion));
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_VENTA_ACCESO')")
    public ResponseEntity<ResumenVentasDTO> resumen() {
        return ResponseEntity.ok(service.resumen());
    }

    @GetMapping("/top-productos")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_VENTA_ACCESO')")
    public ResponseEntity<List<TopProductoDTO>> topProductos(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "UNIDADES") OrdenTopProductos orden,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(service.topProductos(desde, hasta, orden, limite));
    }

    @GetMapping("/por-cliente")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_VENTA_ACCESO')")
    public ResponseEntity<List<VentaClienteDTO>> porCliente(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(service.ventasPorCliente(desde, hasta, limite));
    }

    @GetMapping("/por-vendedor")
    @PreAuthorize("hasAuthority('PERMISO_DATOS_VENTA_ACCESO')")
    public ResponseEntity<List<VentaVendedorDTO>> porVendedor(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(service.ventasPorVendedor(desde, hasta));
    }
}
