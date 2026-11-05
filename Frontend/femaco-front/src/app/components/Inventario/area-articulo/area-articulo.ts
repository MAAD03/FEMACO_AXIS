import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaArticulo as AreaArticuloModel, PageAreaArticulo } from '../../../core/models/area-articulo.model';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { AreaArticuloService } from '../../../core/services/area-articulo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-area-articulo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UsuariosEmailPipe],
  templateUrl: './area-articulo.html',
  styleUrl: './area-articulo.css',
})
export class AreaArticulo implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly areaArticuloService = inject(AreaArticuloService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);
  private readonly usuarioService = inject(UsuarioService);

  form!: FormGroup;

  lista = signal<AreaArticuloModel[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  tamanioPagina = signal(20);
  readonly tamanosPagina = [5, 10, 20, 50];
  editando = false;
  idEditando: number | null = null;

  get permisos() {
    return this.conjuntoMenuService.getPermisosPorPagina('area-articulo');
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
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(1000)],
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');

    this.areaArticuloService.buscarPaginado(this.paginaActual(), this.tamanioPagina()).subscribe({
      next: (pagina: PageAreaArticulo) => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las áreas de artículo');
        this.cargando.set(false);
      },
    });
  }

  onTamanioPaginaChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.tamanioPagina.set(Number(target?.value ?? this.tamanioPagina()));
    this.paginaActual.set(0);
    this.cargarLista();
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
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

    const datos: AreaArticuloModel = {
      nombre: this.form.value.nombre,
      descripcion: this.form.value.descripcion || undefined,
      usuarioCreacion: usuarioId,
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');

    if (this.editando && this.idEditando) {
      datos.usuarioModif = usuarioId;
      this.areaArticuloService.actualizar(this.idEditando, datos).subscribe({
        next: () => this.finalizarOperacion('Área de artículo actualizada correctamente'),
        error: () => {
          this.error.set('Error al actualizar el área de artículo');
          this.cargando.set(false);
        },
      });
    } else {
      this.areaArticuloService.crear(datos).subscribe({
        next: () => this.finalizarOperacion('Área de artículo creada correctamente'),
        error: () => {
          this.error.set('Error al crear el área de artículo');
          this.cargando.set(false);
        },
      });
    }
  }

  editar(item: AreaArticuloModel): void {
    if (!this.puedeEditar) return;

    this.editando = true;
    this.idEditando = item.idAreaArticulo!;
    this.form.patchValue({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number): void {
    if (!this.puedeEliminar) return;

    if (!confirm('¿Está seguro de eliminar esta área de artículo?')) return;

    this.cargando.set(true);
    this.areaArticuloService.eliminar(id).subscribe({
      next: () => this.finalizarOperacion('Área de artículo eliminada correctamente'),
      error: () => {
        this.error.set('Error al eliminar el área de artículo');
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
      descripcion: '',
    });
    this.editando = false;
    this.idEditando = null;
    this.cargando.set(false);
  }

  get f() {
    return this.form.controls;
  }
}
