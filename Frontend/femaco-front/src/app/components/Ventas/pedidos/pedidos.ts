import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pedido, PagePedido } from '../../../core/models/pedido.model';
import { EstadoPedidoNombrePipe } from '../../../core/pipes/catalogo-pipes/estado-pedido-nombre-pipe';
import { EstadoPedido } from '../../../core/models/catalogo-models/estado-pedido.model';
import { AuthService } from '../../../core/services/auth.service';
import { EstadoPedidoService } from '../../../core/services/catalogo-services/estado-pedido.service';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { PedidoService } from '../../../core/services/pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, EstadoPedidoNombrePipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pedidoService = inject(PedidoService);
  private readonly estadoPedidoService = inject(EstadoPedidoService);
  private readonly authService = inject(AuthService);
  private readonly conjuntoMenuService = inject(ConjuntoMenuService);

  form!: FormGroup;
  lista = signal<Pedido[]>([]);
  estados = signal<EstadoPedido[]>([]);
  pedidoEditando = signal<Pedido | null>(null);
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

  get permisos() { return this.conjuntoMenuService.getPermisosPorPagina('pedidos'); }
  get puedeEditar(): boolean { return this.permisos.cambio; }

  ngOnInit(): void {
    this.form = this.fb.group({
      fechaEntrega: ['', Validators.required],
      direccionEntrega: ['', [Validators.required, Validators.maxLength(255)]],
      numeroEntrega: ['', Validators.maxLength(45)],
      notasEntrega: ['', Validators.maxLength(500)],
      idEstadoPedido: [null, Validators.required],
    });
    this.estadoPedidoService.buscarTodos().subscribe({ next: estados => this.estados.set(estados ?? []) });
    this.estadoPedidoService.loadNombreCache().subscribe();
    this.cargarLista();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.error.set('');
    this.pedidoService.buscarPaginado(this.paginaActual(), this.tamanioPagina()).subscribe({
      next: (pagina: PagePedido) => {
        this.lista.set(pagina.content ?? []);
        this.totalPaginas.set(pagina.totalPages ?? 0);
        this.totalElementos.set(pagina.totalElements ?? 0);
        this.paginaActual.set(pagina.number ?? 0);
        this.cargando.set(false);
      },
      error: () => { this.error.set('Error al cargar los pedidos'); this.cargando.set(false); },
    });
  }

  editar(item: Pedido): void {
    if (!this.puedeEditar || item.idPedido == null) return;
    this.editando = true;
    this.idEditando = item.idPedido;
    this.pedidoEditando.set(item);
    this.form.patchValue({
      fechaEntrega: this.formatearFecha(item.fechaEntrega),
      direccionEntrega: item.direccionEntrega ?? '',
      numeroEntrega: item.numeroEntrega ?? '',
      notasEntrega: item.notasEntrega ?? '',
      idEstadoPedido: item.idEstadoPedido ?? null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(): void {
    if (!this.editando || !this.puedeEditar || this.idEditando == null) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const usuarioId = this.authService.getCurrentUser()?.idUsuario;
    if (!usuarioId) { this.error.set('No se encontró el usuario autenticado'); return; }

    const value = this.form.value;
    const datos: Pedido = {
      fechaEntrega: value.fechaEntrega,
      direccionEntrega: value.direccionEntrega?.trim(),
      numeroEntrega: value.numeroEntrega?.trim() || undefined,
      notasEntrega: value.notasEntrega?.trim() || undefined,
      idEstadoPedido: Number(value.idEstadoPedido),
      usuarioModif: usuarioId,
    };

    this.cargando.set(true);
    this.error.set('');
    this.pedidoService.actualizar(this.idEditando, datos).subscribe({
      next: () => {
        this.mensaje.set('Pedido actualizado correctamente');
        this.resetForm();
        this.cargarLista();
      },
      error: () => { this.error.set('Error al actualizar el pedido'); this.cargando.set(false); },
    });
  }

  cancelar(): void { this.resetForm(); }

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

  private resetForm(): void {
    this.form.reset({ fechaEntrega: '', direccionEntrega: '', numeroEntrega: '', notasEntrega: '', idEstadoPedido: null });
    this.editando = false;
    this.idEditando = null;
    this.pedidoEditando.set(null);
    this.cargando.set(false);
  }

  private formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '';
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return '';
    return valor.toISOString().slice(0, 10);
  }

  get f() { return this.form.controls; }
}
