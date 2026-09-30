package com.femaco.main.Controller.Ventas;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.femaco.main.Service.Ventas.ComprobanteVentaPdfService;
import com.femaco.main.Service.Ventas.VentaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ventas")
public class VentaController {

    private final VentaService ventaService;
    private final ComprobanteVentaPdfService comprobanteVentaPdfService;

    public VentaController(VentaService ventaService,
                           ComprobanteVentaPdfService comprobanteVentaPdfService) {
        this.ventaService = ventaService;
        this.comprobanteVentaPdfService = comprobanteVentaPdfService;
    }

    @GetMapping("/buscar-paginado")
    @PreAuthorize("hasAuthority('PERMISO_VENTAS_ACCESO')")
    public ResponseEntity<Page<Venta>> buscarPaginado(
            VentaFiltroDTO filtro,
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {

        return ResponseEntity.ok(ventaService.buscarConFiltros(filtro, pageable));
    }

    @GetMapping("/buscar/{idVenta}")
    @PreAuthorize("hasAuthority('PERMISO_VENTAS_ACCESO')")
    public ResponseEntity<VentaConDetallesDTO> buscarPorId(@PathVariable Long idVenta) {
        return ventaService.buscarPorIdConDetalles(idVenta)
                .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

        @GetMapping("/comprobante/{idVenta}")
        @PreAuthorize("hasAuthority('PERMISO_VENTAS_ACCESO')")
        public ResponseEntity<byte[]> generarComprobante(@PathVariable Long idVenta) {
        Venta venta = ventaService.buscarPorId(idVenta)
            .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada: " + idVenta));
        byte[] pdf = comprobanteVentaPdfService.generarPdf(idVenta);
        String numeroFactura = venta.getNumeroFactura();
        String nombreArchivo = numeroFactura == null || numeroFactura.isBlank()
            ? "comprobante-venta-" + idVenta
            : numeroFactura;

        ContentDisposition disposition = ContentDisposition.attachment()
            .filename(nombreArchivo + ".pdf")
            .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);

        return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
        }

    @PostMapping("/crear-con-detalles")
    @PreAuthorize("hasAuthority('PERMISO_VENTAS_ALTA')")
    public ResponseEntity<Venta> crearConDetalles(@Valid @RequestBody VentaCreateDTO dto) {
        Venta creada = ventaService.crearConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/anular/{idVenta}")
    @PreAuthorize("hasAuthority('PERMISO_VENTAS_BAJA')")
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
