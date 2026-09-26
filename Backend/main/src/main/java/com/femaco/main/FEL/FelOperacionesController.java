package com.femaco.main.FEL;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.Ventas.Venta;
import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.Ventas.VentaRepository;

@RestController
@RequestMapping("/ventas/{idVenta}/fel")
public class FelOperacionesController {

    private final FelCertificacionService certificacionService;
    private final FelAnulacionService anulacionService;
    private final FelPdfGeneratorService pdfGeneratorService;
    private final UsuarioRepository usuarioRepository;
    private final VentaRepository ventaRepository;

    public FelOperacionesController(FelCertificacionService certificacionService,
                                     FelAnulacionService anulacionService,
                                     FelPdfGeneratorService pdfGeneratorService,
                                     UsuarioRepository usuarioRepository,
                                     VentaRepository ventaRepository) {
        this.certificacionService = certificacionService;
        this.anulacionService = anulacionService;
        this.pdfGeneratorService = pdfGeneratorService;
        this.usuarioRepository = usuarioRepository;
        this.ventaRepository = ventaRepository;
    }

    public record AnulacionRequest(String motivo) {}

    @PostMapping("/certificar")
    public ResponseEntity<byte[]> certificar(@PathVariable Long idVenta) {
        VentaFel ventaFel = certificacionService.certificar(idVenta, obtenerIdUsuarioAccion());
        return construirRespuestaPdf(idVenta, ventaFel);
    }

    @PostMapping("/anular")
    public ResponseEntity<byte[]> anular(@PathVariable Long idVenta,
                                          @RequestBody AnulacionRequest request) {
        VentaFel ventaFel = anulacionService.anular(idVenta, request.motivo(), obtenerIdUsuarioAccion());
        return construirRespuestaPdf(idVenta, ventaFel);
    }

    private ResponseEntity<byte[]> construirRespuestaPdf(Long idVenta, VentaFel ventaFel) {
        byte[] pdf = pdfGeneratorService.generarPdf(idVenta);

        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalStateException("Venta no encontrada: " + idVenta));

        String nombreArchivo = "factura-" + valorOTexto(venta.getNumeroFactura())
            + "-" + valorOTexto(ventaFel.getSerieDocumento()) + "-"
                + valorOTexto(ventaFel.getNumeroDocumento()) + ".pdf";

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(nombreArchivo)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private String valorOTexto(String valor) {
        return valor == null ? "" : valor;
    }

    private Integer obtenerIdUsuarioAccion() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UnauthorizedException("Usuario no autenticado");
        }

        Usuario usuario = usuarioRepository.findByCorreoElectronico(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Usuario autenticado no encontrado"));

        if (usuario.getIdUsuario() == null) {
            throw new UnauthorizedException("El usuario autenticado no tiene un ID válido");
        }

        return usuario.getIdUsuario().intValue();
    }
}
