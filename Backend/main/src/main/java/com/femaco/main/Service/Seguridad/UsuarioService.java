package com.femaco.main.Service.Seguridad;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          JavaMailSender mailSender) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    public List<Usuario> buscarTodos() {
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Usuario> buscarPaginar(Pageable pageable) {
        return usuarioRepository.findAll(pageable);
    }

    @Transactional
    public boolean eliminar(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            return false;
        }
        usuarioRepository.deleteById(idUsuario);
        return true;
    }

    @Transactional
    public Optional<Usuario> reiniciarPassword(Long idUsuario) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();

        return usuarioRepository.findById(idUsuario)
                .map(usuario -> {
                    String passwordTemporal = generarPasswordTemporal();
                    usuario.setPassword(passwordEncoder.encode(passwordTemporal));
                    usuario.setRequiereCambioPassword(true);
                    usuario.setIntentosFallidos(0);
                    usuario.setFechaModif(LocalDateTime.now());
                    usuario.setUsuarioModif(usuarioAutenticado.getIdUsuario().intValue());
                    Usuario actualizado = usuarioRepository.save(usuario);
                    enviarCorreoReinicioPasswordTemporal(
                            actualizado.getCorreoElectronico(),
                            actualizado.getNombre(),
                            passwordTemporal
                    );
                    return actualizado;
                });
    }

    @Transactional
    public Usuario crear(Usuario usuario) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        LocalDateTime ahora = LocalDateTime.now();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();
        String passwordTemporal = generarPasswordTemporal();
        usuario.setIdUsuario(null);
        usuario.setFechaCreacion(ahora);
        usuario.setFechaModif(ahora);
        usuario.setUsuarioCreacion(usuarioActual);
        usuario.setUsuarioModif(usuarioActual);
        usuario.setRequiereCambioPassword(true);
        usuario.setIntentosFallidos(0);
        usuario.setPassword(passwordEncoder.encode(passwordTemporal));
        Usuario guardado = usuarioRepository.save(usuario);
        enviarCorreoPasswordTemporal(guardado.getCorreoElectronico(),
                                     guardado.getNombre(),
                                     passwordTemporal);

        return guardado;
    }

    @Transactional
    public Optional<Usuario> actualizar(Long idUsuario, Usuario datosNuevos) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();

        return usuarioRepository.findById(idUsuario).map(existente -> {
            existente.setNombre(datosNuevos.getNombre());
            existente.setApellido(datosNuevos.getApellido());
            existente.setCorreoElectronico(datosNuevos.getCorreoElectronico());
            existente.setRequiereCambioPassword(datosNuevos.getRequiereCambioPassword());
            existente.setIntentosFallidos(datosNuevos.getIntentosFallidos() != null
                    ? datosNuevos.getIntentosFallidos()
                    : existente.getIntentosFallidos());
            existente.setIdGenero(datosNuevos.getIdGenero());
            existente.setIdEstadoUsuario(datosNuevos.getIdEstadoUsuario());
            existente.setIdSucursal(datosNuevos.getIdSucursal());
            existente.setIdRol(datosNuevos.getIdRol());
            existente.setUsuarioModif(usuarioActual);
            existente.setFechaModif(LocalDateTime.now());
            return usuarioRepository.save(existente);
        });
    }

    @Transactional
    public Optional<Usuario> actualizarPassword(String correo, String nuevaPassword) {
        return usuarioRepository.findByCorreoElectronico(correo)
                .filter(u -> Boolean.TRUE.equals(u.getRequiereCambioPassword()))
                .map(u -> {
                    u.setPassword(passwordEncoder.encode(nuevaPassword));
                    u.setRequiereCambioPassword(false);
                    u.setIntentosFallidos(0);
                    u.setFechaModif(LocalDateTime.now());
                    u.setUsuarioModif(u.getIdUsuario().intValue());
                    return usuarioRepository.save(u);
                });
    }

    public record LoginResultado(
            Optional<Usuario> usuario,
            boolean requiereCambioPassword,
            String motivo,
            Integer intentosFallidos,
            boolean loginExitoso
    ) {}

    @Transactional
    public LoginResultado autenticar(String correo, String passwordPlano) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreoElectronico(correo);

        if (usuarioOpt.isEmpty()) {
            return new LoginResultado(Optional.empty(), false, "Credenciales inválidas", 0, false);
        }

        Usuario usuario = usuarioOpt.get();
        Long idEstadoUsuario = usuario.getIdEstadoUsuario();
        Integer intentosFallidosActuales = usuario.getIntentosFallidos() == null ? 0 : usuario.getIntentosFallidos();

        if (idEstadoUsuario != null && idEstadoUsuario == 2L) {
            return new LoginResultado(Optional.empty(), false, "Usuario inactivo", intentosFallidosActuales, false);
        }

        if (idEstadoUsuario != null && idEstadoUsuario == 3L) {
            return new LoginResultado(Optional.empty(), false, "Usuario bloqueado", intentosFallidosActuales, false);
        }

        if (idEstadoUsuario == null || idEstadoUsuario != 1L) {
            return new LoginResultado(Optional.empty(), false, "Estado de usuario no válido", intentosFallidosActuales, false);
        }

        if (Boolean.TRUE.equals(usuario.getRequiereCambioPassword())) {
            return new LoginResultado(Optional.empty(), true, "El usuario requiere cambio de contraseña", intentosFallidosActuales, false);
        }

        if (!passwordEncoder.matches(passwordPlano, usuario.getPassword())) {
            int nuevosIntentosFallidos = intentosFallidosActuales + 1;
            usuario.setIntentosFallidos(nuevosIntentosFallidos);
            usuario.setFechaModif(LocalDateTime.now());
            usuario.setUsuarioModif(usuario.getIdUsuario() != null ? usuario.getIdUsuario().intValue() : 0);

            if (nuevosIntentosFallidos >= 6) {
                usuario.setIdEstadoUsuario(3L);
                usuarioRepository.save(usuario);
                return new LoginResultado(Optional.empty(), false, "Usuario bloqueado por exceso de intentos fallidos", nuevosIntentosFallidos, false);
            }

            usuarioRepository.save(usuario);
            return new LoginResultado(Optional.empty(), false, "Credenciales inválidas", nuevosIntentosFallidos, false);
        }

        usuario.setIntentosFallidos(0);
        usuario.setFechaModif(LocalDateTime.now());
        usuario.setUsuarioModif(usuario.getIdUsuario() != null ? usuario.getIdUsuario().intValue() : 0);
        usuarioRepository.save(usuario);

        return new LoginResultado(Optional.of(usuario), false, null, 0, true);
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UnauthorizedException("Usuario no autenticado");
        }

        String correo = authentication.getName();

        return usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new UnauthorizedException("Usuario autenticado no encontrado"));
    }

    private String generarPasswordTemporal() {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 10; i++) {
            sb.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        return sb.toString();
    }

    private void enviarCorreoReinicioPasswordTemporal(String destino, String nombre, String passwordTemporal) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(destino);
            mensaje.setSubject("Reinicio de contraseña - Contraseña temporal");
            mensaje.setText(
                    "Hola " + nombre + ",\n\n" +
                    "Se ha solicitado un reinicio de contraseña para tu cuenta.\n" +
                    "Tu nueva contraseña temporal es: " + passwordTemporal + "\n\n" +
                    "Por seguridad debes cambiarla al iniciar sesión nuevamente.\n\n" +
                    "Saludos."
            );
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("Error enviando correo de reinicio a " + destino + ": " + e.getMessage());
        }
    }

    private void enviarCorreoPasswordTemporal(String destino, String nombre, String passwordTemporal) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(destino);
            mensaje.setSubject("Tu cuenta ha sido creada - Contraseña temporal");
            mensaje.setText(
                    "Hola " + nombre + ",\n\n" +
                    "Se ha creado una cuenta para ti.\n" +
                    "Tu contraseña temporal es: " + passwordTemporal + "\n\n" +
                    "Por seguridad debes cambiarla al iniciar sesión por primera vez.\n\n" +
                    "Saludos."
            );
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("Error enviando correo a " + destino + ": " + e.getMessage());
        }
    }
}