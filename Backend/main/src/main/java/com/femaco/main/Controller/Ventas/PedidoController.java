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

import com.femaco.main.DTOs.PedidoFiltroDTO;
import com.femaco.main.Entity.Ventas.Pedido;
import com.femaco.main.Service.Ventas.PedidoPdfService;
import com.femaco.main.Service.Ventas.PedidoService;

@RestController
@RequestMapping("/pedido")
public class PedidoController {

    private final PedidoService pedidoService;
    private final PedidoPdfService pedidoPdfService;

    public PedidoController(PedidoService pedidoService, PedidoPdfService pedidoPdfService) {
        this.pedidoService = pedidoService;
        this.pedidoPdfService = pedidoPdfService;
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAuthority('PERMISO_PEDIDOS_ACCESO')")
    public ResponseEntity<Page<Pedido>> buscar(
            PedidoFiltroDTO filtro,
            @PageableDefault(size = 5, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(pedidoService.buscarTodos(filtro, pageable));
    }

    @GetMapping("/buscar-pendientes")
    @PreAuthorize("hasAuthority('PERMISO_PEDIDOS_ACCESO')")
    public ResponseEntity<Page<Pedido>> buscarPendientes(
            @PageableDefault(size = 5, sort = "fechaCreacion", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(pedidoService.buscarPendientes(pageable));
    }

    @PostMapping("/crear")
    @PreAuthorize("hasAuthority('PERMISO_PEDIDOS_ALTA')")
    public ResponseEntity<Pedido> crear(@RequestBody Pedido pedido) {
        Pedido creado = pedidoService.crear(pedido);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idPedido}")
    @PreAuthorize("hasAuthority('PERMISO_PEDIDOS_CAMBIO')")
    public ResponseEntity<Pedido> editar(@PathVariable Long idPedido,
                                           @RequestBody Pedido pedido) {
        return pedidoService.actualizar(idPedido, pedido)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/listado-entrega/{idPedido}")
    @PreAuthorize("hasAuthority('PERMISO_PEDIDOS_ACCESO')")
    public ResponseEntity<byte[]> generarListadoEntrega(@PathVariable Long idPedido) {
        byte[] pdf = pedidoPdfService.generarPdf(idPedido);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("listado-entrega-pedido-" + idPedido + ".pdf")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
/*
    @DeleteMapping("/eliminar/{idPedido}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idPedido) {
        boolean eliminado = pedidoService.eliminar(idPedido);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
*/
    
}
