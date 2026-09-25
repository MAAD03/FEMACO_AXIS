import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente as ClienteModel, PageCliente } from '../../../core/models/cliente.model';
import { EstadoCliente } from '../../../core/models/catalogo-models/estado-cliente.model';
import { EstadoClienteNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-cliente-nombre-pipe';
import { UsuariosEmailPipe } from '../../../core/pipes/usuarios-email';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { EstadoClienteService } from '../../../core/services/catalogo-services/estado-cliente.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, EstadoClienteNombrePipe, UsuariosEmailPipe],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css',
})
export class Cliente implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly estadoClienteService = inject(EstadoClienteService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  form!: FormGroup;
  busquedaForm!: FormGroup;
  lista = signal<ClienteModel[]>([]);
  estados = signal<EstadoCliente[]>([]);
  clienteEditando = signal<ClienteModel | null>(null);
  cargando = signal(false);
  buscando = signal(false);
  mensaje = signal('');
  error = signal('');
  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  tamanioPagina = signal(10);
  readonly tamanosPagina = [5, 10, 20, 50];
  editando = false;
  idEditando: number | null = null;
  private mensajeTimeout?: ReturnType<typeof setTimeout>;
  private errorTimeout?: ReturnType<typeof setTimeout>;

  get permisos() { return this.conjuntoMenuService.getPermisosPorPagina('cliente'); }
  get puedeCrear(): boolean { return this.permisos.alta; }
  get puedeEditar(): boolean { return this.permisos.cambio; }
  get puedeEliminar(): boolean { return this.permisos.baja; }

  ngOnInit(): void {
    this.initForms();
    this.cargarEstados();
    this.cargarLista();
    this.clienteService.loadNombreCache().subscribe();
    this.estadoClienteService.loadNombreCache().subscribe();
  }

  private initForms(): void {
    this.form = this.fb.group({
      nit: ['', [Validators.required, Validators.maxLength(45)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      telefono: ['', Validators.maxLength(45)],
      correo: ['', [Validators.email, Validators.maxLength(100)]],
      direccion: ['', Validators.maxLength(255)],
      idEstadoCliente: [null, [Validators.required, Validators.min(1)]],
    });
    this.busquedaForm = this.fb.group({ nit: ['', [Validators.required, Validators.maxLength(45)]] });
  }

  private cargarEstados(): void {
    this.estadoClienteService.buscarTodos().subscribe({
      next: (data) => this.estados.set(data ?? []),
      error: () => this.error.set('Error al cargar los estados de cliente'),
    });
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');
    this.clienteService.buscarPaginado(this.paginaActual(), this.tamanioPagina(), 'nombre,asc').subscribe({
      next: (pagina: PageCliente) => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => { this.error.set('Error al cargar los clientes'); this.cargando.set(false); },
    });
  }

  buscarPorNit(): void {
    if (this.busquedaForm.invalid) { this.busquedaForm.markAllAsTouched(); return; }
    this.buscando.set(true);
    this.error.set('');
    this.clienteService.buscarPorNit(this.busquedaForm.value.nit?.trim()).subscribe({
      next: (cliente) => {
        this.editar(cliente);
        this.mostrarMensaje('Cliente encontrado y cargado en el formulario');
        this.buscando.set(false);
      },
      error: () => {
        this.mostrarError('No se encontró un cliente con ese NIT');
        this.buscando.set(false);
      },
    });
  }

  cambiarTamano(): void { this.paginaActual.set(0); this.cargarLista(); }

  onTamanioPaginaChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.tamanioPagina.set(Number(target?.value ?? this.tamanioPagina()));
    this.cambiarTamano();
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarLista();
  }

  onSubmit(): void {
    if (this.editando && !this.puedeEditar) { this.error.set('No tienes permiso para modificar'); return; }
    if (!this.editando && !this.puedeCrear) { this.error.set('No tienes permiso para crear'); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const usuarioId = this.authService.getCurrentUser()?.idUsuario;
    if (!usuarioId) { this.error.set('No se encontró el usuario autenticado'); return; }
    const value = this.form.value;
    const datos: ClienteModel = {
      nit: value.nit?.trim(), nombre: value.nombre?.trim(), telefono: value.telefono?.trim() || undefined,
      correo: value.correo?.trim() || undefined, direccion: value.direccion?.trim() || undefined,
      idEstadoCliente: Number(value.idEstadoCliente), usuarioCreacion: usuarioId,
    };

    this.cargando.set(true);
    this.mensaje.set('');
    this.error.set('');
    if (this.editando && this.idEditando) {
      datos.usuarioModif = usuarioId;
      this.clienteService.actualizar(this.idEditando, datos).subscribe({
        next: () => this.finalizarOperacion('Cliente actualizado correctamente'),
        error: () => { this.error.set('Error al actualizar el cliente'); this.cargando.set(false); },
      });
    } else {
      this.clienteService.crear(datos).subscribe({
        next: () => this.finalizarOperacion('Cliente creado correctamente'),
        error: () => { this.error.set('Error al crear el cliente'); this.cargando.set(false); },
      });
    }
  }

  editar(item: ClienteModel): void {
    if (!this.puedeEditar || item.idCliente == null) return;
    this.editando = true;
    this.idEditando = item.idCliente;
    this.clienteEditando.set(item);
    this.form.patchValue({ nit: item.nit, nombre: item.nombre, telefono: item.telefono ?? '', correo: item.correo ?? '', direccion: item.direccion ?? '', idEstadoCliente: item.idEstadoCliente ?? null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number): void {
    if (!this.puedeEliminar || !confirm('¿Está seguro de eliminar este cliente?')) return;
    this.cargando.set(true);
    this.clienteService.eliminar(id).subscribe({
      next: () => this.finalizarOperacion('Cliente eliminado correctamente'),
      error: () => { this.error.set('Error al eliminar el cliente'); this.cargando.set(false); },
    });
  }

  cancelar(): void { this.resetForm(); }

  private finalizarOperacion(mensaje: string): void {
    this.mostrarMensaje(mensaje);
    this.resetForm();
    this.cargarLista();
  }

  private mostrarMensaje(mensaje: string): void {
    if (this.mensajeTimeout) clearTimeout(this.mensajeTimeout);
    this.mensaje.set(mensaje);
    this.mensajeTimeout = setTimeout(() => this.mensaje.set(''), 3500);
  }

  private mostrarError(error: string): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.error.set(error);
    this.errorTimeout = setTimeout(() => this.error.set(''), 3500);
  }

  private resetForm(): void {
    this.form.reset({ nit: '', nombre: '', telefono: '', correo: '', direccion: '', idEstadoCliente: null });
    this.editando = false;
    this.idEditando = null;
    this.clienteEditando.set(null);
    this.cargando.set(false);
  }

  get f() { return this.form.controls; }
  get bf() { return this.busquedaForm.controls; }
}
