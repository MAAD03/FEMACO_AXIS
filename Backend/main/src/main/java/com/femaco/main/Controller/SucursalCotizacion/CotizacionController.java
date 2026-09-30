package com.femaco.main.Controller.SucursalCotizacion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.CotizacionConDetallesDTO;
import com.femaco.main.DTOs.CotizacionCreateDTO;
import com.femaco.main.Entity.SucursalCotizacion.Cotizacion;
import com.femaco.main.Service.SucursalCotizacion.CotizacionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/cotizacion")
public class CotizacionController {

    private final CotizacionService cotizacionService;

    public CotizacionController(CotizacionService cotizacionService) {
        this.cotizacionService = cotizacionService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<Page<Cotizacion>> buscar(
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(cotizacionService.buscarTodosPaginado(pageable));
    }

    @GetMapping("/buscar-por-nit/{nit}")
    @PreAuthorize("hasAuthority('PERMISO_COTIZACION_ACCESO')")
    public ResponseEntity<Cotizacion> buscarPorNit(@PathVariable String nit) {
        return cotizacionService.buscarPorNit(nit)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar/{idCotizacion}")
    @PreAuthorize("hasAuthority('PERMISO_COTIZACION_ACCESO')")
    public ResponseEntity<CotizacionConDetallesDTO> buscarPorId(@PathVariable Long idCotizacion) {
        return cotizacionService.buscarPorIdConDetalles(idCotizacion)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/crear-con-detalles")
    @PreAuthorize("hasAuthority('PERMISO_COTIZACION_ALTA')")
    public ResponseEntity<Cotizacion> crearConDetalles(@Valid @RequestBody CotizacionCreateDTO dto) {
        Cotizacion creada = cotizacionService.crearConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }
    
}
