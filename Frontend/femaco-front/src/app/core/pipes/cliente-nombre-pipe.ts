import { inject, Pipe, PipeTransform } from '@angular/core';
import { ClienteService } from '../services/cliente.service';

@Pipe({
  name: 'clienteNombre',
  standalone: true,
  pure: false,
})
export class ClienteNombrePipe implements PipeTransform {
  private readonly clienteService = inject(ClienteService);

  transform(idCliente: number | null | undefined): string {
    return this.clienteService.getNombreById(idCliente);
  }
}
