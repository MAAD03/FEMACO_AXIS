package com.femaco.main.Controller.Suministro;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.DTOs.OrdenCompraConDetallesDTO;
import com.femaco.main.DTOs.OrdenCompraCreateDTO;
import com.femaco.main.DTOs.OrdenCompraUpdateDTO;
import com.femaco.main.Entity.Suministro.OrdenCompra;
import com.femaco.main.Service.Suministro.ComprobanteOrdenCompraPdfService;
import com.femaco.main.Service.Suministro.OrdenCompraService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ordenCompra")
public class OrdenCompraController {

    private final OrdenCompraService ordenCompraService;
    private final ComprobanteOrdenCompraPdfService comprobanteOrdenCompraPdfService;

    public OrdenCompraController(OrdenCompraService ordenCompraService,
                                 ComprobanteOrdenCompraPdfService comprobanteOrdenCompraPdfService) {
        this.ordenCompraService = ordenCompraService;
        this.comprobanteOrdenCompraPdfService = comprobanteOrdenCompraPdfService;
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAuthority('PERMISO_ORDEN_COMPRA_ACCESO')")
    public ResponseEntity<Page<OrdenCompra>> buscar(
            @RequestParam(required = false) Long idProveedor,
            @PageableDefault(size = 20, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(ordenCompraService.buscarTodos(pageable, idProveedor));
    }

    @GetMapping("/buscar/{idOrdenCompra}")
    @PreAuthorize("hasAuthority('PERMISO_ORDEN_COMPRA_ACCESO')")
    public ResponseEntity<OrdenCompraConDetallesDTO> buscarPorId(@PathVariable Long idOrdenCompra) {
        return ordenCompraService.buscarPorIdConDetalles(idOrdenCompra)
                .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/comprobante/{idOrdenCompra}")
    @PreAuthorize("hasAuthority('PERMISO_ORDEN_COMPRA_ACCESO')")
    public ResponseEntity<byte[]> generarComprobante(@PathVariable Long idOrdenCompra) {
        if (ordenCompraService.buscarPorId(idOrdenCompra).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdf = comprobanteOrdenCompraPdfService.generarPdf(idOrdenCompra);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("comprobante-orden-compra-" + idOrdenCompra + ".pdf")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

     @PostMapping("/crear-con-detalles")
    @PreAuthorize("hasAuthority('PERMISO_ORDEN_COMPRA_ALTA')")
    public ResponseEntity<OrdenCompra> crearConDetalles(@Valid @RequestBody OrdenCompraCreateDTO dto) {
        OrdenCompra creada = ordenCompraService.crearConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/actualizar-con-detalles")
    @PreAuthorize("hasAuthority('PERMISO_ORDEN_COMPRA_CAMBIO')")
    public ResponseEntity<OrdenCompra> actualizarConDetalles(@Valid @RequestBody OrdenCompraUpdateDTO dto) {
        OrdenCompra actualizada = ordenCompraService.actualizarConDetalles(dto);
        return ResponseEntity.ok(actualizada);
    }
    /* 
    @PostMapping("/crear")
    public ResponseEntity<OrdenCompra> crear(@RequestBody OrdenCompra ordenCompra) {
        OrdenCompra creado = ordenCompraService.crear(ordenCompra);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idOrdenCompra}")
    public ResponseEntity<OrdenCompra> editar(@PathVariable Long idOrdenCompra,
                                                @RequestBody OrdenCompra ordenCompra) {
        return ordenCompraService.actualizar(idOrdenCompra, ordenCompra)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idOrdenCompra}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idOrdenCompra) {
        boolean eliminado = ordenCompraService.eliminar(idOrdenCompra);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    */
}
