import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ModuloMenu } from '../../../core/models/conjunto-menu.model';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';

interface AccesoRapido {
  id: number;
  nombre: string;
  modulo: string;
  pagina: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(ConjuntoMenuService);

  readonly usuario$ = this.authService.currentUser$;
  readonly fechaActual = signal(new Date());
  readonly accesosRapidos$ = this.menuService.menu$.pipe(
    map((modulos) => this.obtenerAccesosRapidos(modulos))
  );

  private readonly reloj = window.setInterval(() => {
    this.fechaActual.set(new Date());
  }, 1000);

  ngOnDestroy(): void {
    window.clearInterval(this.reloj);
  }

  private obtenerAccesosRapidos(modulos: ModuloMenu[]): AccesoRapido[] {
    return modulos
      .map((modulo) => {
        const primerMenuConOpciones = modulo.menus.find((menu) => menu.opciones.length > 0);
        const opcion = primerMenuConOpciones?.opciones[0];

        return opcion ? {
          id: opcion.idOpcion,
          nombre: opcion.nombre,
          modulo: modulo.nombre,
          pagina: this.normalizarRuta(opcion.pagina),
        } : null;
      })
      .filter((acceso): acceso is AccesoRapido => acceso !== null)
      .slice(0, 6);
  }

  private normalizarRuta(pagina: string): string {
    return pagina.startsWith('/') ? pagina : `/${pagina}`;
  }
}
