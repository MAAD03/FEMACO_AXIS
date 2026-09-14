import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs';
import { ApiErrorService } from '../services/api-error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);

  return next(req).pipe(
    catchError((error) => apiErrorService.handleHttpError(error))
  );
};
