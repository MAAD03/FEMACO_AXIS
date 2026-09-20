import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Proveedor as ProveedorModel } from '../../../core/models/proveedor.model';
import { EstadoProveedor } from '../../../core/models/catalogo-models/estado-proveedor.model';
import { EstadoProveedorNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-proveedor-nombre-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { EstadoProveedorService } from '../../../core/services/catalogo-services/estado-proveedor.service';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EstadoProveedorNombrePipe, UsuariosEmailPipe],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.css',
})
export class Proveedor implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly proveedorService = inject(ProveedorService);
  private readonly estadoProveedorService = inject(EstadoProveedorService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);
  private readonly usuarioService = inject(UsuarioService);

  form!: FormGroup;
  lista = signal<ProveedorModel[]>([]);
  estados = signal<EstadoProveedor[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  editando = false;
  idEditando: number | null = null;

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('proveedor');
  }

  get puedeCrear(): boolean { return this.permisos.alta; }
  get puedeEditar(): boolean { return this.permisos.cambio; }
  get puedeEliminar(): boolean { return this.permisos.baja; }

  ngOnInit(): void {
    this.initForm();
    this.cargarEstados();
    this.cargarLista();
    this.estadoProveedorService.loadNombreCache().subscribe();
    this.usuarioService.loadEmailCache().subscribe();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      nit: ['', Validators.maxLength(45)],
      telefono: ['', Validators.maxLength(45)],
      direccion: ['', Validators.maxLength(65535)],
      nombreContacto: ['', Validators.maxLength(100)],
      idEstadoProveedor: [null, Validators.required],
    });
  }

  private cargarEstados(): void {
    this.estadoProveedorService.buscarTodos().subscribe({
      next: (data) => this.estados.set(data ?? []),
      error: () => this.error.set('Error al cargar los estados de proveedor'),
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');
    this.proveedorService.buscarTodos().subscribe({
      next: (data) => {
        this.lista.set(data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los proveedores');
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
    if ((this.editando && !this.puedeEditar) || (!this.editando && !this.puedeCrear)) {
      this.error.set(this.editando ? 'No tienes permiso para modificar' : 'No tienes permiso para crear');
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
    const datos: ProveedorModel = {
      nombre: value.nombre.trim(),
      nit: value.nit?.trim() || undefined,
      telefono: value.telefono?.trim() || undefined,
      direccion: value.direccion?.trim() || undefined,
      nombreContacto: value.nombreContacto?.trim() || undefined,
      idEstadoProveedor: Number(value.idEstadoProveedor),
      usuarioCreacion: usuarioId,
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');

    if (this.editando && this.idEditando) {
      datos.usuarioModif = usuarioId;
      this.proveedorService.actualizar(this.idEditando, datos).subscribe({
        next: () => this.finalizarOperacion('Proveedor actualizado correctamente'),
        error: () => {
          this.error.set('Error al actualizar el proveedor');
          this.cargando.set(false);
        },
      });
    } else {
      this.proveedorService.crear(datos).subscribe({
        next: () => this.finalizarOperacion('Proveedor creado correctamente'),
        error: () => {
          this.error.set('Error al crear el proveedor');
          this.cargando.set(false);
        },
      });
    }
  }

  editar(item: ProveedorModel): void {
    if (!this.puedeEditar) return;
    this.editando = true;
    this.idEditando = item.idProveedor!;
    this.form.patchValue({
      nombre: item.nombre,
      nit: item.nit ?? '',
      telefono: item.telefono ?? '',
      direccion: item.direccion ?? '',
      nombreContacto: item.nombreContacto ?? '',
      idEstadoProveedor: item.idEstadoProveedor,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number): void {
    if (!this.puedeEliminar || !confirm('¿Está seguro de eliminar este proveedor?')) return;
    this.cargando.set(true);
    this.proveedorService.eliminar(id).subscribe({
      next: () => this.finalizarOperacion('Proveedor eliminado correctamente'),
      error: () => {
        this.error.set('Error al eliminar el proveedor');
        this.cargando.set(false);
      },
    });
  }

  cancelar(): void { this.resetForm(); }

  private resetForm(): void {
    this.form.reset({
      nombre: '', nit: '', telefono: '', direccion: '', nombreContacto: '', idEstadoProveedor: null,
    });
    this.editando = false;
    this.idEditando = null;
    this.cargando.set(false);
  }

  get f() { return this.form.controls; }
}
