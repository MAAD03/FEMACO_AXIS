import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadoUsuario } from '../../../core/models/catalogo-models/estado-usuario.model';
import { Genero } from '../../../core/models/catalogo-models/genero.model';
import { Rol } from '../../../core/models/rol.model';
import { Sucursal } from '../../../core/models/sucursal.model';
import { Usuario as UsuarioModel, PageUsuario } from '../../../core/models/usuario.model';
import { EstadoUsuarioNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-usuario-nombre-pipe';
import { GeneroNombrePipe } from '../../../core/pipes/catalogo-pipes/genero-nombre-pipe';
import { RolNombrePipe } from '../../../core/pipes/rol-nombre-pipe';
import { SucursalNombrePipe } from '../../../core/pipes/sucursal-nombre-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { EstadoUsuarioService } from '../../../core/services/catalogo-services/estado-usuario.service';
import { GeneroService } from '../../../core/services/catalogo-services/genero.service';
import { RolService } from '../../../core/services/rol.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UsuariosEmailPipe,
    GeneroNombrePipe,
    EstadoUsuarioNombrePipe,
    SucursalNombrePipe,
    RolNombrePipe,
  ],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css',
})
export class Usuario implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);
  private readonly generoService = inject(GeneroService);
  private readonly estadoUsuarioService = inject(EstadoUsuarioService);
  private readonly sucursalService = inject(SucursalService);
  private readonly rolService = inject(RolService);

  form!: FormGroup;

  lista = signal<UsuarioModel[]>([]);
  generos = signal<Genero[]>([]);
  estados = signal<EstadoUsuario[]>([]);
  sucursales = signal<Sucursal[]>([]);
  roles = signal<Rol[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  tamanioPagina = signal(10);
  readonly tamanosPagina = [5, 10, 20, 50];
  editando = false;
  idEditando: number | null = null;

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('usuario');
  }

  get puedeCrear(): boolean {
    return this.permisos.alta;
  }

  get puedeEditar(): boolean {
    return this.permisos.cambio;
  }

  get puedeEliminar(): boolean {
    return this.permisos.baja;
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();
    this.cargarLista();
    this.usuarioService.loadEmailCache().subscribe();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      correoElectronico: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      requiereCambioPassword: [true],
      puedeAplicarDescuento: [false],
      idGenero: [null, [Validators.required, Validators.min(1)]],
      idEstadoUsuario: [null, [Validators.required, Validators.min(1)]],
      idSucursal: [null, [Validators.required, Validators.min(1)]],
      idRol: [null, [Validators.required, Validators.min(1)]],
    });
  }

  private cargarCatalogos(): void {
    this.generoService.buscarTodos().subscribe({
      next: (data) => this.generos.set(data ?? []),
      error: () => this.error.set('Error al cargar los géneros'),
    });

    this.estadoUsuarioService.buscarTodos().subscribe({
      next: (data) => this.estados.set(data ?? []),
      error: () => this.error.set('Error al cargar los estados de usuario'),
    });

    this.sucursalService.buscarTodos().subscribe({
      next: (data) => this.sucursales.set(data ?? []),
      error: () => this.error.set('Error al cargar las sucursales'),
    });

    this.rolService.buscarTodos().subscribe({
      next: (data) => this.roles.set(data ?? []),
      error: () => this.error.set('Error al cargar los roles'),
    });

    this.generoService.loadNombreCache().subscribe();
    this.estadoUsuarioService.loadNombreCache().subscribe();
    this.sucursalService.loadNombreCache().subscribe();
    this.rolService.loadNombreCache().subscribe();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    this.usuarioService.buscarPagina(this.paginaActual(), this.tamanioPagina(), 'idUsuario,asc').subscribe({
      next: (pagina: PageUsuario) => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los usuarios');
        this.cargando.set(false);
      },
    });
  }

  cambiarTamano(): void {
    this.paginaActual.set(0);
    this.cargarLista();
  }

  onTamanioPaginaChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const nuevoTamano = Number(target?.value ?? this.tamanioPagina());
    this.tamanioPagina.set(nuevoTamano);
    this.cambiarTamano();
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) {
      return;
    }

    this.paginaActual.set(pagina);
    this.cargarLista();
  }

  private finalizarOperacion(mensaje: string): void {
    this.mensaje.set(mensaje);
    this.resetForm();
    this.cargarLista();

    setTimeout(() => {
      this.mensaje.set('');
    }, 3500);
  }

  onSubmit(): void {
    if (this.editando && !this.puedeEditar) {
      this.error.set('No tienes permiso para modificar');
      return;
    }
    if (!this.editando && !this.puedeCrear) {
      this.error.set('No tienes permiso para crear');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuarioId = this.authService.getCurrentUser()?.idUsuario;
    if (!usuarioId) {
      this.error.set('No se encontró el usuario autenticado');
      return;
    }

    const value = this.form.value;
    const datos: UsuarioModel = {
      nombre: value.nombre?.trim(),
      apellido: value.apellido?.trim(),
      correoElectronico: value.correoElectronico?.trim(),
      requiereCambioPassword: !!value.requiereCambioPassword,
      puedeAplicarDescuento: !!value.puedeAplicarDescuento,
      idGenero: Number(value.idGenero),
      idEstadoUsuario: Number(value.idEstadoUsuario),
      idSucursal: Number(value.idSucursal),
      idRol: Number(value.idRol),
      usuarioCreacion: usuarioId,
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');

    if (this.editando && this.idEditando) {
      datos.usuarioModif = usuarioId;
      this.usuarioService.actualizar(this.idEditando, datos).subscribe({
        next: () => this.finalizarOperacion('Usuario actualizado correctamente'),
        error: () => {
          this.error.set('Error al actualizar el usuario');
          this.cargando.set(false);
        },
      });
    } else {
      this.usuarioService.crear(datos).subscribe({
        next: () => this.finalizarOperacion('Usuario creado correctamente'),
        error: () => {
          this.error.set('Error al crear el usuario');
          this.cargando.set(false);
        },
      });
    }
  }

  editar(item: UsuarioModel): void {
    if (!this.puedeEditar) return;

    this.editando = true;
    this.idEditando = item.idUsuario!;
    this.form.patchValue({
      nombre: item.nombre,
      apellido: item.apellido,
      correoElectronico: item.correoElectronico,
      requiereCambioPassword: !!item.requiereCambioPassword,
      puedeAplicarDescuento: !!item.puedeAplicarDescuento,
      idGenero: item.idGenero ?? null,
      idEstadoUsuario: item.idEstadoUsuario ?? null,
      idSucursal: item.idSucursal ?? null,
      idRol: item.idRol ?? null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number): void {
    if (!this.puedeEliminar) return;

    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    this.cargando.set(true);
    this.usuarioService.eliminar(id).subscribe({
      next: () => this.finalizarOperacion('Usuario eliminado correctamente'),
      error: () => {
        this.error.set('Error al eliminar el usuario');
        this.cargando.set(false);
      },
    });
  }

  reiniciarPassword(id: number): void {
    if (!this.puedeEditar) return;

    if (!confirm('¿Está seguro de reiniciar la contraseña de este usuario?')) return;

    this.cargando.set(true);
    this.usuarioService.reiniciarPassword(id).subscribe({
      next: () => this.finalizarOperacion('Contraseña reiniciada correctamente'),
      error: () => {
        this.error.set('Error al reiniciar la contraseña');
        this.cargando.set(false);
      },
    });
  }

  cancelar(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset({
      nombre: '',
      apellido: '',
      correoElectronico: '',
      requiereCambioPassword: true,
      puedeAplicarDescuento: false,
      idGenero: null,
      idEstadoUsuario: null,
      idSucursal: null,
      idRol: null,
    });
    this.editando = false;
    this.idEditando = null;
    this.cargando.set(false);
  }

  get f() {
    return this.form.controls;
  }
}
