import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sucursal as SucursalModel } from '../../../core/models/sucursal.model';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-sucursal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UsuariosEmailPipe],
  templateUrl: './sucursal.html',
  styleUrl: './sucursal.css',
})
export class Sucursal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);
  private readonly usuarioService = inject(UsuarioService);

  form!: FormGroup;
  lista = signal<SucursalModel[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  editando = false;
  idEditando: number | null = null;

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('sucursal');
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
    this.cargarLista();
    this.usuarioService.loadEmailCache().subscribe();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      direccion: ['', Validators.maxLength(255)],
      telefono: ['', Validators.maxLength(45)],
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    this.sucursalService.buscarTodos().subscribe({
      next: (data) => {
        this.lista.set(data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las sucursales');
        this.cargando.set(false);
      },
    });
  }

  private finalizarOperacion(mensaje: string): void {
    this.mensaje.set(mensaje);
    this.resetForm();
    this.cargarLista();

    setTimeout(() => this.mensaje.set(''), 3500);
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

    const datos: SucursalModel = {
      nombre: this.form.value.nombre,
      direccion: this.form.value.direccion || undefined,
      telefono: this.form.value.telefono || undefined,
      usuarioCreacion: usuarioId,
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');

    if (this.editando && this.idEditando) {
      datos.usuarioModif = usuarioId;
      this.sucursalService.actualizar(this.idEditando, datos).subscribe({
        next: () => this.finalizarOperacion('Sucursal actualizada correctamente'),
        error: () => {
          this.error.set('Error al actualizar la sucursal');
          this.cargando.set(false);
        },
      });
    } else {
      this.sucursalService.crear(datos).subscribe({
        next: () => this.finalizarOperacion('Sucursal creada correctamente'),
        error: () => {
          this.error.set('Error al crear la sucursal');
          this.cargando.set(false);
        },
      });
    }
  }

  editar(item: SucursalModel): void {
    if (!this.puedeEditar) return;

    this.editando = true;
    this.idEditando = item.idSucursal!;
    this.form.patchValue({
      nombre: item.nombre,
      direccion: item.direccion ?? '',
      telefono: item.telefono ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number): void {
    if (!this.puedeEliminar) return;
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;

    this.cargando.set(true);
    this.sucursalService.eliminar(id).subscribe({
      next: () => this.finalizarOperacion('Sucursal eliminada correctamente'),
      error: () => {
        this.error.set('Error al eliminar la sucursal');
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
      direccion: '',
      telefono: '',
    });
    this.editando = false;
    this.idEditando = null;
    this.cargando.set(false);
  }

  get f() {
    return this.form.controls;
  }
}
