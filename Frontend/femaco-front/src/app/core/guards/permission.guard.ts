import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ConjuntoMenuService } from '../services/conjunto-menu.service';

export const permissionGuard: CanActivateFn = (route) => {
  const conjuntoMenuService = inject(ConjuntoMenuService);
  const router = inject(Router);
  const pagina = (route.data['permiso'] as string | undefined) ?? route.routeConfig?.path;

  if (pagina === 'dashboard') {
    return true;
  }

  if (!pagina) {
    return router.createUrlTree(['/dashboard']);
  }

  const validarPermiso = () =>
    conjuntoMenuService.tienePagina(pagina)
      ? true
      : router.createUrlTree(['/dashboard']);

  if (conjuntoMenuService.getMenuActual().length > 0) {
    return validarPermiso();
  }

  return conjuntoMenuService.cargarMenu().pipe(
    map(validarPermiso),
    catchError(() => of(router.createUrlTree(['/dashboard'])))
  );
};