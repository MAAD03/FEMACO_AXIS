import { inject, Pipe, PipeTransform } from '@angular/core';
import { ArticuloService } from '../services/articulo.service';

@Pipe({
  name: 'articuloNombre',
  standalone: true,
  pure: false,
})
export class ArticuloNombrePipe implements PipeTransform {
  private readonly articuloService = inject(ArticuloService);

  transform(idArticulo: number | null | undefined): string {
    return this.articuloService.getNombreById(idArticulo);
  }
}
