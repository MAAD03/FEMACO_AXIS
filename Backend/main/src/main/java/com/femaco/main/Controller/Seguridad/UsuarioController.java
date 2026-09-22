package com.femaco.main.Controller.Seguridad;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Service.Seguridad.UsuarioService;

@RestController
@RequestMapping("/usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Usuario>> buscar() {
        return ResponseEntity.ok(usuarioService.buscarTodos());
    }

    @GetMapping("/buscar-paginado")
    public ResponseEntity<Page<Usuario>> buscarPaginado(
            @PageableDefault(size = 20, sort = "idUsuario", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return ResponseEntity.ok(usuarioService.buscarPaginar(pageable));
    }

    @PostMapping("/crear")
    public ResponseEntity<Usuario> crear(@RequestBody Usuario usuario) {
        Usuario creado = usuarioService.crear(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/editar/{idUsuario}")
    public ResponseEntity<Usuario> editar(@PathVariable Long idUsuario,
                                          @RequestBody Usuario usuario) {
        return usuarioService.actualizar(idUsuario, usuario)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/reiniciar-password/{idUsuario}")
    public ResponseEntity<Usuario> reiniciarPassword(@PathVariable Long idUsuario) {
        return usuarioService.reiniciarPassword(idUsuario)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{idUsuario}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idUsuario) {
        boolean eliminado = usuarioService.eliminar(idUsuario);
        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    public record UsuarioResumen(
            Long idUsuario,
            String nombre,
            String apellido,
            String correoElectronico) {
    }
}
