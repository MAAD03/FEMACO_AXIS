package com.femaco.main.Controller.Seguridad;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Config.JwtUtil;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Service.Seguridad.UsuarioService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final JwtUtil jwtUtil;

    public AuthController(UsuarioService usuarioService, JwtUtil jwtUtil) {
        this.usuarioService = usuarioService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        UsuarioService.LoginResultado resultado = usuarioService.autenticar(
                request.correoElectronico(),
                request.password()
        );

        if (!resultado.loginExitoso()) {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("mensaje", resultado.motivo() != null ? resultado.motivo() : "Credenciales inválidas");
            body.put("motivo", resultado.motivo() != null ? resultado.motivo() : "Credenciales inválidas");
            body.put("intentosFallidos", resultado.intentosFallidos());
            body.put("requiereCambioPassword", resultado.requiereCambioPassword());
            body.put("RequiereCambioPassword", resultado.requiereCambioPassword());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        Usuario usuario = resultado.usuario().orElseThrow();
        String token = jwtUtil.generateToken(usuario.getCorreoElectronico());

        return ResponseEntity.ok(new LoginResponse(
                token,
                usuario.getIdUsuario(),
                usuario.getNombre()
        ));
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody CambioPasswordRequest request) {
        return usuarioService.actualizarPassword(request.correoElectronico(), request.nuevaPassword())
                .map(u -> ResponseEntity.ok().body(Map.of("mensaje", "Contraseña actualizada correctamente")))
                .orElseGet(() -> ResponseEntity.badRequest()
                        .body(Map.of("error", "No se puede cambiar la contraseña. Verifique el correo o que el usuario requiera cambio de contraseña.")));
    }

    public record LoginRequest(String correoElectronico, String password) {}
    public record LoginResponse(String token, Long idUsuario, String nombre) {}
    public record CambioPasswordRequest(String correoElectronico, String nuevaPassword) {}
}