package com.femaco.main.FEL;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;

@RestController
@RequestMapping("/ventas/{idVenta}/fel")
public class FelOperacionesController {

    private final FelCertificacionService certificacionService;
    private final FelAnulacionService anulacionService;
    private final UsuarioRepository usuarioRepository;

    public FelOperacionesController(FelCertificacionService certificacionService,
                                     FelAnulacionService anulacionService,
                                     UsuarioRepository usuarioRepository) {
        this.certificacionService = certificacionService;
        this.anulacionService = anulacionService;
        this.usuarioRepository = usuarioRepository;
    }

    public record AnulacionRequest(String motivo) {}

    @PostMapping("/certificar")
    public VentaFel certificar(@PathVariable Long idVenta) {
        return certificacionService.certificar(idVenta, obtenerIdUsuarioAccion());
    }

    @PostMapping("/anular")
    public VentaFel anular(@PathVariable Long idVenta,
                            @RequestBody AnulacionRequest request) {
        return anulacionService.anular(idVenta, request.motivo(), obtenerIdUsuarioAccion());
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
