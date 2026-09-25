import { inject, Pipe, PipeTransform } from '@angular/core';
import { ClienteService } from '../services/cliente.service';

@Pipe({
  name: 'clieneNit',
  standalone: true,
  pure: false,
})
export class ClieneNitPipe implements PipeTransform {
  private readonly clienteService = inject(ClienteService);

  transform(idCliente: number | null | undefined): string {
    return this.clienteService.getNitById(idCliente);
  }
}
