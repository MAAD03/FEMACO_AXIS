import { inject, Pipe, PipeTransform } from '@angular/core';
import { ProveedorService } from '../services/proveedor.service';

@Pipe({
  name: 'proveedorNombre',
  standalone: true,
  pure: false,
})
export class ProveedorNombrePipe implements PipeTransform {
  private readonly proveedorService = inject(ProveedorService);

  transform(idProveedor: number | null | undefined): string {
    return this.proveedorService.getNombreById(idProveedor);
  }
}
